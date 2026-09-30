package com.sharespare.dto.response;

import com.sharespare.entity.PaymentMethod;
import com.sharespare.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponseDto {

    private String paymentReference;
    private String transactionReference;
    private Long bookingId;
    private String bookingReference;
    private BigDecimal amount;
    private BigDecimal rentalAmount;
    private BigDecimal depositAmount;
    private String currency;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
