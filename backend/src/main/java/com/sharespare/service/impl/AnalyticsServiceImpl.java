package com.sharespare.service.impl;

import com.sharespare.dto.response.AnalyticsSummaryDto;
import com.sharespare.dto.response.ItemPerformanceDto;
import com.sharespare.dto.response.RevenueTrendDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;

    @Override
    @Transactional(readOnly = true)
    public AnalyticsSummaryDto getSummary(String lenderEmail) {
        User lender = getLender(lenderEmail);
        List<Item> items = itemRepository.findByLenderOrderByIdDesc(lender);
        List<Booking> bookings = bookingRepository.findByItemLenderOrderByIdDesc(lender);

        long totalItems = items.size();
        long totalBookings = bookings.size();

        long activeRentals = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.ACTIVE)
                .count();

        long completedRentals = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();

        long cancelledBookings = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .map(Booking::getRentalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDeposits = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.ACTIVE ||
                        b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.RETURNED ||
                        b.getStatus() == BookingStatus.RETURN_REQUESTED)
                .map(Booking::getDepositAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDamageDeductions = BigDecimal.ZERO;
        BigDecimal totalRefunds = BigDecimal.ZERO;

        for (Booking b : bookings) {
            Optional<Payment> paymentOpt = paymentRepository.findByBookingId(b.getId());
            if (paymentOpt.isPresent()) {
                Payment p = paymentOpt.get();
                if (p.getDamageDeduction() != null) {
                    totalDamageDeductions = totalDamageDeductions.add(p.getDamageDeduction());
                }
                if (p.getRefundAmount() != null) {
                    totalRefunds = totalRefunds.add(p.getRefundAmount());
                }
            }
        }

        double averageRating = calculateLenderAverageRating(items);

        return AnalyticsSummaryDto.builder()
                .totalItems(totalItems)
                .totalBookings(totalBookings)
                .activeRentals(activeRentals)
                .completedRentals(completedRentals)
                .cancelledBookings(cancelledBookings)
                .totalRevenue(totalRevenue)
                .totalDeposits(totalDeposits)
                .totalDamageDeductions(totalDamageDeductions)
                .totalRefunds(totalRefunds)
                .averageRating(averageRating)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ItemPerformanceDto> getItemPerformance(String lenderEmail) {
        User lender = getLender(lenderEmail);
        List<Item> items = itemRepository.findByLenderOrderByIdDesc(lender);
        List<Booking> bookings = bookingRepository.findByItemLenderOrderByIdDesc(lender);

        return items.stream().map(item -> {
            List<Booking> itemBookings = bookings.stream()
                    .filter(b -> b.getItem() != null && b.getItem().getId().equals(item.getId()))
                    .collect(Collectors.toList());

            long totalB = itemBookings.size();
            long completedB = itemBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
            long activeB = itemBookings.stream().filter(b -> b.getStatus() == BookingStatus.ACTIVE).count();
            long cancelledB = itemBookings.stream().filter(b -> b.getStatus() == BookingStatus.CANCELLED).count();

            BigDecimal itemRevenue = itemBookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                    .map(Booking::getRentalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Double rawAvg = reviewRepository.findAverageRatingByItemId(item.getId());
            double itemAvg = rawAvg != null ? Math.round(rawAvg * 10.0) / 10.0 : 0.0;
            long itemReviews = reviewRepository.countByItemId(item.getId());

            return ItemPerformanceDto.builder()
                    .itemId(item.getId())
                    .itemName(item.getName())
                    .category(item.getCategory())
                    .totalBookings(totalB)
                    .completedBookings(completedB)
                    .activeBookings(activeB)
                    .cancelledBookings(cancelledB)
                    .totalRevenue(itemRevenue)
                    .averageRating(itemAvg)
                    .totalReviews(itemReviews)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RevenueTrendDto> getRevenueTrend(String lenderEmail) {
        User lender = getLender(lenderEmail);
        List<Booking> bookings = bookingRepository.findByItemLenderOrderByIdDesc(lender);

        Map<String, RevenueTrendDto> trendMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");

        for (Booking b : bookings) {
            if (b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.ACTIVE || b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.RETURNED) {
                String period = (b.getCreatedAt() != null ? b.getCreatedAt() : java.time.LocalDateTime.now()).format(formatter);
                BigDecimal revenue = b.getStatus() == BookingStatus.COMPLETED ? (b.getRentalAmount() != null ? b.getRentalAmount() : BigDecimal.ZERO) : BigDecimal.ZERO;

                RevenueTrendDto current = trendMap.getOrDefault(period, RevenueTrendDto.builder()
                        .period(period)
                        .bookingCount(0L)
                        .revenue(BigDecimal.ZERO)
                        .build());

                current.setBookingCount(current.getBookingCount() + 1);
                current.setRevenue(current.getRevenue().add(revenue));
                trendMap.put(period, current);
            }
        }

        return new ArrayList<>(trendMap.values());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<ItemPerformanceDto>> getTopItems(String lenderEmail) {
        List<ItemPerformanceDto> itemPerformances = getItemPerformance(lenderEmail);

        List<ItemPerformanceDto> mostBooked = itemPerformances.stream()
                .sorted(Comparator.comparing(ItemPerformanceDto::getTotalBookings).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<ItemPerformanceDto> highestRevenue = itemPerformances.stream()
                .sorted(Comparator.comparing(ItemPerformanceDto::getTotalRevenue).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<ItemPerformanceDto> highestRated = itemPerformances.stream()
                .sorted(Comparator.comparing(ItemPerformanceDto::getAverageRating).reversed())
                .limit(5)
                .collect(Collectors.toList());

        Map<String, List<ItemPerformanceDto>> topItemsMap = new LinkedHashMap<>();
        topItemsMap.put("mostBooked", mostBooked);
        topItemsMap.put("highestRevenue", highestRevenue);
        topItemsMap.put("highestRated", highestRated);

        return topItemsMap;
    }

    private User getLender(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Unauthorized: Authentication email is missing.");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private double calculateLenderAverageRating(List<Item> items) {
        if (items == null || items.isEmpty()) {
            return 0.0;
        }

        double totalSum = 0.0;
        long totalCount = 0;

        for (Item item : items) {
            Double avg = reviewRepository.findAverageRatingByItemId(item.getId());
            long count = reviewRepository.countByItemId(item.getId());
            if (avg != null && count > 0) {
                totalSum += avg * count;
                totalCount += count;
            }
        }

        if (totalCount == 0) {
            return 0.0;
        }

        double rawAvg = totalSum / totalCount;
        return Math.round(rawAvg * 10.0) / 10.0;
    }
}
