package com.sharespare.service.impl;

import com.sharespare.dto.request.ProcessPaymentRequest;
import com.sharespare.dto.response.PaymentHistoryResponseDto;
import com.sharespare.dto.response.PaymentResponseDto;
import com.sharespare.entity.Booking;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.Payment;
import com.sharespare.entity.PaymentStatus;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.entity.NotificationType;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.PaymentRepository;
import com.sharespare.service.NotificationService;
import com.sharespare.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public PaymentResponseDto processPayment(String userEmail, ProcessPaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + request.getBookingId()));

        // Authorization check: Only the renter can pay
        if (!booking.getRenter().getEmail().equalsIgnoreCase(userEmail)) {
            throw new BadRequestException("Unauthorized: Only the booking renter can process payment for this booking.");
        }

        // Check if booking is in valid state for payment
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Cannot pay for a cancelled booking.");
        }

        // Prevent duplicate successful payment
        if (paymentRepository.existsByBookingIdAndStatus(booking.getId(), PaymentStatus.SUCCESS)) {
            throw new BadRequestException("Payment has already been successfully completed for this booking.");
        }

        // Generate unique payment reference
        String payRef = "PAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Check for mock failure request
        boolean isFailure = Boolean.TRUE.equals(request.getTestFailure());

        if (isFailure) {
            Payment failedPayment = Payment.builder()
                    .paymentReference(payRef)
                    .booking(booking)
                    .amount(booking.getTotalAmount()) // Authoritative amount from DB
                    .currency("INR")
                    .paymentMethod(request.getPaymentMethod())
                    .status(PaymentStatus.FAILED)
                    .transactionReference(null)
                    .build();

            Payment savedFailed = paymentRepository.save(failedPayment);
            return mapToDto(savedFailed);
        }

        // SUCCESS path
        String txnRef = "TXN-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase();

        Payment successPayment = Payment.builder()
                .paymentReference(payRef)
                .booking(booking)
                .amount(booking.getTotalAmount()) // Authoritative amount from DB
                .currency("INR")
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.SUCCESS)
                .transactionReference(txnRef)
                .build();

        Payment savedSuccess = paymentRepository.save(successPayment);

        // Update booking lifecycle status to CONFIRMED
        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        // Trigger Notification to Renter
        try {
            notificationService.createNotification(
                    booking.getRenter(),
                    NotificationType.PAYMENT_SUCCESS,
                    "Payment Successful",
                    "Your payment for " + booking.getItem().getName() + " was successful.",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently
        }

        // Trigger Notification to Lender
        try {
            notificationService.createNotification(
                    booking.getItem().getLender(),
                    NotificationType.BOOKING_CONFIRMED,
                    "Booking Confirmed",
                    "Payment received for your item " + booking.getItem().getName() + ".",
                    booking.getId(),
                    "BOOKING"
            );
        } catch (Exception e) {
            // Log notification error silently
        }

        return mapToDto(savedSuccess);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentHistoryResponseDto getPaymentHistory(String userEmail) {
        List<Payment> payments = paymentRepository.findByBookingRenterEmailOrderByIdDesc(userEmail);
        List<PaymentResponseDto> dtos = payments.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PaymentHistoryResponseDto.builder()
                .payments(dtos)
                .totalCount(dtos.size())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponseDto getBookingPayment(String userEmail, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        boolean isRenter = booking.getRenter().getEmail().equalsIgnoreCase(userEmail);
        boolean isLender = booking.getItem().getLender().getEmail().equalsIgnoreCase(userEmail);

        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized: You do not have permission to view payment for this booking.");
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment details found for booking ID: " + bookingId));

        return mapToDto(payment);
    }

    private PaymentResponseDto mapToDto(Payment payment) {
        return PaymentResponseDto.builder()
                .paymentReference(payment.getPaymentReference())
                .transactionReference(payment.getTransactionReference())
                .bookingId(payment.getBooking().getId())
                .bookingReference(payment.getBooking().getBookingReference())
                .amount(payment.getAmount())
                .rentalAmount(payment.getBooking().getRentalAmount())
                .depositAmount(payment.getBooking().getDepositAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
