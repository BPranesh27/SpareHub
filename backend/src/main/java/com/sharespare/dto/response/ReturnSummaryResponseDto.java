package com.sharespare.dto.response;

import com.sharespare.entity.BookingStatus;
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
public class ReturnSummaryResponseDto {

    private Long bookingId;
    private String bookingReference;
    private String itemName;
    private String renterName;
    private String lenderName;
    private BigDecimal originalDeposit;
    private BigDecimal damageDeduction;
    private BigDecimal finalRefund;
    private BookingStatus bookingStatus;
    private LocalDateTime returnedAt;
}
