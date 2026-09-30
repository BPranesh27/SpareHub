package com.sharespare.service.impl;

import com.sharespare.dto.request.VerifyHandoverRequest;
import com.sharespare.dto.response.HandoverResponseDto;
import com.sharespare.entity.Booking;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.Handover;
import com.sharespare.entity.HandoverStatus;
import com.sharespare.entity.PaymentStatus;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.entity.NotificationType;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.HandoverRepository;
import com.sharespare.repository.PaymentRepository;
import com.sharespare.service.HandoverService;
import com.sharespare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class HandoverServiceImpl implements HandoverService {

    private final HandoverRepository handoverRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public HandoverResponseDto getOrCreateHandover(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        // 1. Authorization: Only the item lender can generate QR code
        if (!booking.getItem().getLender().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Unauthorized: Only the item lender can generate or view the handover QR code.");
        }

        // 2. Booking status requirement: Must be CONFIRMED
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Handover QR code can only be generated for CONFIRMED bookings.");
        }

        // 3. Payment requirement: Successful payment must exist
        boolean hasSuccessPayment = paymentRepository.existsByBookingIdAndStatus(bookingId, PaymentStatus.SUCCESS);
        if (!hasSuccessPayment) {
            throw new BadRequestException("Handover QR code requires a successful payment for the booking.");
        }

        // 4. Return existing handover if present
        Optional<Handover> existingOpt = handoverRepository.findByBookingId(bookingId);
        if (existingOpt.isPresent()) {
            return mapToDto(existingOpt.get());
        }

        // 5. Generate secure server-side token: SS-HO-<UUID>
        String token = "SS-HO-" + UUID.randomUUID().toString();

        Handover handover = Handover.builder()
                .booking(booking)
                .handoverToken(token)
                .status(HandoverStatus.PENDING)
                .generatedAt(LocalDateTime.now())
                .build();

        Handover savedHandover = handoverRepository.save(handover);

        // Trigger Notification to Renter
        try {
            notificationService.createNotification(
                    booking.getRenter(),
                    NotificationType.HANDOVER_READY,
                    "Item Ready for Handover",
                    "The lender has prepared " + booking.getItem().getName() + " for pickup.",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently
        }

        return mapToDto(savedHandover);
    }

    @Override
    @Transactional
    public HandoverResponseDto verifyHandover(String userEmail, VerifyHandoverRequest request) {
        if (request == null || request.getToken() == null || request.getToken().trim().isEmpty()) {
            throw new BadRequestException("Handover token is required.");
        }

        Handover handover = handoverRepository.findByHandoverToken(request.getToken().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or non-existent handover token."));

        Booking booking = handover.getBooking();

        // 1. Authorization: Only the renter can verify handover
        if (!booking.getRenter().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Unauthorized: Only the booking renter can verify item handover.");
        }

        // 2. Handover status check
        if (handover.getStatus() == HandoverStatus.VERIFIED) {
            throw new BadRequestException("This handover token has already been verified.");
        }
        if (handover.getStatus() != HandoverStatus.PENDING) {
            throw new BadRequestException("Handover token is no longer pending or valid.");
        }

        // 3. Booking status check
        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Booking is not in CONFIRMED state for handover verification.");
        }

        // 4. Payment status check
        boolean hasSuccessPayment = paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS);
        if (!hasSuccessPayment) {
            throw new BadRequestException("Handover verification requires a successful payment.");
        }

        // Update Handover
        handover.setStatus(HandoverStatus.VERIFIED);
        handover.setVerifiedAt(LocalDateTime.now());
        Handover savedHandover = handoverRepository.save(handover);

        // Update Booking Status to ACTIVE
        booking.setStatus(BookingStatus.ACTIVE);
        bookingRepository.save(booking);

        // Trigger Notification to Lender
        try {
            notificationService.createNotification(
                    booking.getItem().getLender(),
                    NotificationType.HANDOVER_COMPLETED,
                    "Item Handed Over",
                    "Renter " + booking.getRenter().getName() + " completed QR handover for " + booking.getItem().getName() + ".",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently
        }

        return mapToDto(savedHandover);
    }

    @Override
    @Transactional(readOnly = true)
    public HandoverResponseDto getHandoverStatus(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        boolean isRenter = booking.getRenter().getEmail().equalsIgnoreCase(userEmail);
        boolean isLender = booking.getItem().getLender().getEmail().equalsIgnoreCase(userEmail);

        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized: You do not have permission to view handover details for this booking.");
        }

        Handover handover = handoverRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No handover record found for booking ID: " + bookingId));

        return mapToDto(handover);
    }

    private HandoverResponseDto mapToDto(Handover handover) {
        Booking booking = handover.getBooking();
        return HandoverResponseDto.builder()
                .id(handover.getId())
                .bookingId(booking.getId())
                .bookingReference(booking.getBookingReference())
                .handoverToken(handover.getHandoverToken())
                .status(handover.getStatus())
                .qrPayload(handover.getHandoverToken()) // QR payload equals secure server-generated token
                .generatedAt(handover.getGeneratedAt())
                .verifiedAt(handover.getVerifiedAt())
                .itemName(booking.getItem().getName())
                .renterName(booking.getRenter().getName())
                .lenderName(booking.getItem().getLender().getName())
                .build();
    }
}
