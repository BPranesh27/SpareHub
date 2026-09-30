package com.sharespare.service.impl;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.BookingService;
import com.sharespare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(isolation = Isolation.REPEATABLE_READ)
    public BookingDto createBooking(String userEmail, CreateBookingRequest request) {
        User renter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getItemId()));

        // Rule 1: Self-booking prevention
        if (item.getLender().getId().equals(renter.getId()) || item.getLender().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Self-booking is not allowed: Lenders cannot rent their own items.");
        }

        // Rule 2: Item Availability Status
        if (!"AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus())) {
            throw new BadRequestException("Item is currently unavailable for new reservations.");
        }

        // Rule 3: Date Validations
        LocalDate today = LocalDate.now();
        LocalDate startDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();

        if (startDate == null || endDate == null) {
            throw new BadRequestException("Start date and end date are required.");
        }

        if (startDate.isBefore(today)) {
            throw new BadRequestException("Start date cannot be in the past.");
        }

        if (!endDate.isAfter(startDate)) {
            throw new BadRequestException("End date must be strictly after the start date.");
        }

        // Rule 4: Overlap Prevention Query with Concurrency Protection
        long conflictingCount = bookingRepository.countConflictingBookings(item.getId(), startDate, endDate);
        if (conflictingCount > 0) {
            throw new BadRequestException("The selected dates conflict with an existing booking for this item.");
        }

        // Financial Calculation (Derived strictly from database item rates)
        long days = ChronoUnit.DAYS.between(startDate, endDate);
        BigDecimal rentalAmount = item.getPricePerDay().multiply(BigDecimal.valueOf(days));
        BigDecimal depositAmount = item.getSecurityDeposit();
        BigDecimal totalAmount = rentalAmount.add(depositAmount);

        // Reference Code Generation
        String refCode = "SS-" + (System.currentTimeMillis() % 1000000);

        Booking booking = Booking.builder()
                .bookingReference(refCode)
                .item(item)
                .renter(renter)
                .startDate(startDate)
                .endDate(endDate)
                .rentalAmount(rentalAmount)
                .depositAmount(depositAmount)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Trigger Notification to Lender
        try {
            notificationService.createNotification(
                    item.getLender(),
                    NotificationType.BOOKING_CREATED,
                    "New Booking Request",
                    "Someone requested to rent your " + item.getName() + ".",
                    savedBooking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently without breaking booking transaction
        }

        return mapToDto(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDto getBookingById(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        // Authorization check: Only Renter or Lender can access
        boolean isRenter = booking.getRenter().getEmail().equalsIgnoreCase(userEmail);
        boolean isLender = booking.getItem().getLender().getEmail().equalsIgnoreCase(userEmail);

        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized: You do not have permission to view this booking.");
        }

        return mapToDto(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getMyRentals(String userEmail) {
        User renter = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Booking> bookings = bookingRepository.findByRenterOrderByIdDesc(renter);
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDto> getMyLendingBookings(String userEmail) {
        User lender = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Booking> bookings = bookingRepository.findByItemLenderOrderByIdDesc(lender);
        return bookings.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public BookingDto cancelBooking(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

        boolean isRenter = booking.getRenter().getEmail().equalsIgnoreCase(userEmail);
        boolean isLender = booking.getItem().getLender().getEmail().equalsIgnoreCase(userEmail);

        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized: You do not have permission to cancel this booking.");
        }

        if (booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking cannot be cancelled from status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);

        // Trigger Notification to Counterpart
        try {
            User recipient = isRenter ? booking.getItem().getLender() : booking.getRenter();
            notificationService.createNotification(
                    recipient,
                    NotificationType.BOOKING_CANCELLED,
                    "Booking Cancelled",
                    "Booking #" + booking.getBookingReference() + " for " + booking.getItem().getName() + " was cancelled.",
                    updatedBooking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently
        }

        return mapToDto(updatedBooking);
    }

    private BookingDto mapToDto(Booking booking) {
        long days = ChronoUnit.DAYS.between(booking.getStartDate(), booking.getEndDate());
        String primaryImage = (booking.getItem().getImages() != null && !booking.getItem().getImages().isEmpty())
                ? booking.getItem().getImages().get(0).getImageUrl()
                : "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800";

        return BookingDto.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .itemId(booking.getItem().getId())
                .itemName(booking.getItem().getName())
                .itemCategory(booking.getItem().getCategory())
                .itemImage(primaryImage)
                .location(booking.getItem().getLocation())
                .lenderId(booking.getItem().getLender().getId())
                .lenderName(booking.getItem().getLender().getName())
                .lenderEmail(booking.getItem().getLender().getEmail())
                .renterId(booking.getRenter().getId())
                .renterName(booking.getRenter().getName())
                .renterEmail(booking.getRenter().getEmail())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .rentalDays(days)
                .pricePerDay(booking.getItem().getPricePerDay())
                .rentalAmount(booking.getRentalAmount())
                .depositAmount(booking.getDepositAmount())
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
