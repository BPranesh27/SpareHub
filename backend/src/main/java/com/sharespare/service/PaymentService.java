package com.sharespare.service;

import com.sharespare.dto.request.ProcessPaymentRequest;
import com.sharespare.dto.response.PaymentHistoryResponseDto;
import com.sharespare.dto.response.PaymentResponseDto;

public interface PaymentService {

    PaymentResponseDto processPayment(String userEmail, ProcessPaymentRequest request);

    PaymentHistoryResponseDto getPaymentHistory(String userEmail);

    PaymentResponseDto getBookingPayment(String userEmail, Long bookingId);
}
