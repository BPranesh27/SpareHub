package com.sharespare.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsSummaryDto {

    private Long totalItems;
    private Long totalBookings;
    private Long activeRentals;
    private Long completedRentals;
    private Long cancelledBookings;

    private BigDecimal totalRevenue;
    private BigDecimal totalDeposits;
    private BigDecimal totalDamageDeductions;
    private BigDecimal totalRefunds;

    private Double averageRating;
}
