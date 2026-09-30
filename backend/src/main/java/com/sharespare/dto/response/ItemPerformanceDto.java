package com.sharespare.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemPerformanceDto {

    private Long itemId;
    private String itemName;
    private String category;
    private Long totalBookings;
    private Long completedBookings;
    private Long activeBookings;
    private Long cancelledBookings;

    private BigDecimal totalRevenue;
    private Double averageRating;
    private Long totalReviews;
}
