package com.sharespare.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemRatingSummaryDto {
    private Long itemId;
    private Double averageRating;
    private Long totalReviews;
}
