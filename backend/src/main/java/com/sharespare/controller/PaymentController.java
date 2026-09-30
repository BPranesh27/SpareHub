package com.sharespare.controller;

import com.sharespare.dto.request.ProcessPaymentRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.PaymentHistoryResponseDto;
import com.sharespare.dto.response.PaymentResponseDto;
import com.sharespare.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> processPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProcessPaymentRequest request) {
        PaymentResponseDto response = paymentService.processPayment(userDetails.getUsername(), request);
        return ResponseEntity.ok(
                ApiResponse.success("Payment processed successfully", response)
        );
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<PaymentHistoryResponseDto>> getPaymentHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        PaymentHistoryResponseDto response = paymentService.getPaymentHistory(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Payment history retrieved", response)
        );
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> getBookingPayment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId) {
        PaymentResponseDto response = paymentService.getBookingPayment(userDetails.getUsername(), bookingId);
        return ResponseEntity.ok(
                ApiResponse.success("Booking payment details retrieved", response)
        );
    }
}
