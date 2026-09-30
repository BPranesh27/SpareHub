package com.sharespare.service.impl;

import com.sharespare.dto.request.CreateDamageReportRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.DamageEvidenceDto;
import com.sharespare.dto.response.DamageReportResponseDto;
import com.sharespare.dto.response.ReturnSummaryResponseDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.ReturnService;
import com.sharespare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReturnServiceImpl implements ReturnService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final DamageReportRepository damageReportRepository;
    private final DamageEvidenceRepository damageEvidenceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public BookingDto requestReturn(String email, Long bookingId) {
        User user = getUser(email);
        Booking booking = getBooking(bookingId);

        // Security check: Only the renter can request return
        if (!booking.getRenter().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized: Only the renter of this booking can request a return.");
        }

        // Status check: Booking must be ACTIVE
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new BadRequestException("Cannot request return. Booking status must be ACTIVE, but currently is: " + booking.getStatus());
        }

        // Prevent duplicate return requests
        if (booking.getStatus() == BookingStatus.RETURN_REQUESTED) {
            throw new BadRequestException("Return has already been requested for this booking.");
        }

        booking.setStatus(BookingStatus.RETURN_REQUESTED);
        Booking updated = bookingRepository.save(booking);

        try {
            notificationService.createNotification(
                    booking.getItem().getLender(),
                    NotificationType.RETURN_REQUESTED,
                    "Return Requested",
                    "Renter " + user.getName() + " requested to return " + booking.getItem().getName() + ".",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log or ignore to avoid breaking return transaction
        }

        return mapBookingToDto(updated);
    }

    @Override
    @Transactional
    public DamageReportResponseDto submitDamageInspection(String email, Long bookingId, CreateDamageReportRequest request) {
        User user = getUser(email);
        Booking booking = getBooking(bookingId);

        // Security check: Only the item lender can inspect damages
        if (!booking.getItem().getLender().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized: Only the item lender can submit a damage inspection.");
        }

        // Status check: Booking must be RETURN_REQUESTED
        if (booking.getStatus() != BookingStatus.RETURN_REQUESTED) {
            throw new BadRequestException("Cannot submit inspection. Booking must be in RETURN_REQUESTED state, but currently is: " + booking.getStatus());
        }

        BigDecimal damageAmount = request.getDamageAmount();
        if (damageAmount == null || damageAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Damage amount cannot be negative or null.");
        }

        // Get actual deposit from DB record
        BigDecimal depositAmount = booking.getDepositAmount();
        if (damageAmount.compareTo(depositAmount) > 0) {
            throw new BadRequestException("Damage amount (₹" + damageAmount + ") cannot exceed security deposit (₹" + depositAmount + ").");
        }

        if (damageAmount.compareTo(BigDecimal.ZERO) > 0 && (request.getDescription() == null || request.getDescription().trim().isEmpty())) {
            throw new BadRequestException("Damage description is required when damage amount is greater than zero.");
        }

        // Check if report already exists or create new
        DamageReport report = damageReportRepository.findByBookingId(bookingId)
                .orElseGet(() -> DamageReport.builder().booking(booking).build());

        report.setDamageAmount(damageAmount);
        report.setDescription(request.getDescription());
        report.setStatus(DamageReportStatus.INSPECTED);
        report.setInspectedAt(LocalDateTime.now());

        // Process evidence images if provided
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            report.getEvidences().clear();
            for (String url : request.getImageUrls()) {
                if (url != null && !url.trim().isEmpty()) {
                    DamageEvidence evidence = DamageEvidence.builder()
                            .imageUrl(url.trim())
                            .build();
                    report.addEvidence(evidence);
                }
            }
        }

        DamageReport savedReport = damageReportRepository.save(report);

        // Calculate refund
        BigDecimal deduction = damageAmount;
        BigDecimal refundAmount = depositAmount.subtract(deduction);

        // Update Payment record
        paymentRepository.findByBookingId(bookingId).ifPresent(payment -> {
            payment.setDamageDeduction(deduction);
            payment.setRefundAmount(refundAmount);
            if (refundAmount.compareTo(BigDecimal.ZERO) >= 0) {
                payment.setStatus(PaymentStatus.REFUNDED);
                payment.setRefundedAt(LocalDateTime.now());
            }
            paymentRepository.save(payment);
        });

        // Transition booking status: RETURN_REQUESTED -> RETURNED
        booking.setStatus(BookingStatus.RETURNED);
        bookingRepository.save(booking);

        try {
            notificationService.createNotification(
                    booking.getRenter(),
                    NotificationType.DAMAGE_REPORTED,
                    "Damage Inspection Completed",
                    "Damage inspection completed for " + booking.getItem().getName() + ". Damage amount: ₹" + damageAmount + ".",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Ignore notification failure
        }

        return mapDamageReportToDto(savedReport, depositAmount, refundAmount);
    }

    @Override
    @Transactional
    public BookingDto completeReturn(String email, Long bookingId) {
        User user = getUser(email);
        Booking booking = getBooking(bookingId);

        // Security check: Only lender can complete return
        if (!booking.getItem().getLender().getId().equals(user.getId())) {
            throw new BadRequestException("Unauthorized: Only the item lender can complete the return.");
        }

        // Status check: Booking must be RETURNED
        if (booking.getStatus() != BookingStatus.RETURNED) {
            throw new BadRequestException("Cannot complete return. Booking status must be RETURNED, but currently is: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.COMPLETED);

        // Ensure item is available again
        Item item = booking.getItem();
        item.setAvailabilityStatus("AVAILABLE");

        Booking updated = bookingRepository.save(booking);

        try {
            BigDecimal deposit = booking.getDepositAmount() != null ? booking.getDepositAmount() : BigDecimal.ZERO;
            BigDecimal damage = BigDecimal.ZERO;
            DamageReport dr = damageReportRepository.findByBookingId(bookingId).orElse(null);
            if (dr != null && dr.getDamageAmount() != null) {
                damage = dr.getDamageAmount();
            }
            BigDecimal refund = deposit.subtract(damage);

            notificationService.createNotification(
                    booking.getRenter(),
                    NotificationType.REFUND_PROCESSED,
                    "Refund Processed",
                    "Rental for " + booking.getItem().getName() + " completed. Refund of ₹" + refund + " processed.",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Ignore notification failure
        }

        return mapBookingToDto(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public DamageReportResponseDto getDamageReport(String email, Long bookingId) {
        User user = getUser(email);
        Booking booking = getBooking(bookingId);

        // Security check: Only renter or lender can view damage report
        validateParticipant(user, booking);

        DamageReport report = damageReportRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("DamageReport", "bookingId", bookingId));

        BigDecimal depositAmount = booking.getDepositAmount();
        BigDecimal refundAmount = depositAmount.subtract(report.getDamageAmount());

        return mapDamageReportToDto(report, depositAmount, refundAmount);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnSummaryResponseDto getReturnSummary(String email, Long bookingId) {
        User user = getUser(email);
        Booking booking = getBooking(bookingId);

        // Security check: Only renter or lender can view return summary
        validateParticipant(user, booking);

        BigDecimal originalDeposit = booking.getDepositAmount();
        BigDecimal damageDeduction = BigDecimal.ZERO;
        BigDecimal finalRefund = originalDeposit;

        DamageReport report = damageReportRepository.findByBookingId(bookingId).orElse(null);
        if (report != null && report.getDamageAmount() != null) {
            damageDeduction = report.getDamageAmount();
            finalRefund = originalDeposit.subtract(damageDeduction);
        }

        return ReturnSummaryResponseDto.builder()
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .itemName(booking.getItem().getName())
                .renterName(booking.getRenter().getName())
                .lenderName(booking.getItem().getLender().getName())
                .originalDeposit(originalDeposit)
                .damageDeduction(damageDeduction)
                .finalRefund(finalRefund)
                .bookingStatus(booking.getStatus())
                .returnedAt(booking.getUpdatedAt())
                .build();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Booking getBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
    }

    private void validateParticipant(User user, Booking booking) {
        boolean isRenter = booking.getRenter().getId().equals(user.getId());
        boolean isLender = booking.getItem().getLender().getId().equals(user.getId());
        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized access to booking details.");
        }
    }

    private BookingDto mapBookingToDto(Booking booking) {
        return BookingDto.builder()
                .id(booking.getId())
                .bookingReference(booking.getBookingReference())
                .itemId(booking.getItem().getId())
                .itemName(booking.getItem().getName())
                .renterId(booking.getRenter().getId())
                .renterName(booking.getRenter().getName())
                .lenderId(booking.getItem().getLender().getId())
                .lenderName(booking.getItem().getLender().getName())
                .startDate(booking.getStartDate())
                .endDate(booking.getEndDate())
                .rentalAmount(booking.getRentalAmount())
                .depositAmount(booking.getDepositAmount())
                .totalAmount(booking.getTotalAmount())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private DamageReportResponseDto mapDamageReportToDto(DamageReport report, BigDecimal depositAmount, BigDecimal refundAmount) {
        List<DamageEvidenceDto> evidenceDtos = report.getEvidences() != null ?
                report.getEvidences().stream().map(e -> DamageEvidenceDto.builder()
                        .id(e.getId())
                        .imageUrl(e.getImageUrl())
                        .createdAt(e.getCreatedAt())
                        .build()).collect(Collectors.toList()) : Collections.emptyList();

        return DamageReportResponseDto.builder()
                .id(report.getId())
                .bookingId(report.getBooking().getId())
                .bookingReference(report.getBooking().getBookingReference())
                .damageAmount(report.getDamageAmount())
                .depositAmount(depositAmount)
                .refundAmount(refundAmount)
                .description(report.getDescription())
                .status(report.getStatus())
                .inspectedAt(report.getInspectedAt())
                .createdAt(report.getCreatedAt())
                .evidences(evidenceDtos)
                .build();
    }
}
