package com.sharespare.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponseDto {
    private Long id;
    private Long bookingId;
    private Long reviewerId;
    private String reviewerName;
    private Long itemId;
    private String itemName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
