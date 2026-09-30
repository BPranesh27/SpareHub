package com.sharespare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {

    private Long id;
    private Long lenderId;
    private String lenderName;
    private String lenderEmail;
    private String name;
    private String category;
    private String description;
    private BigDecimal pricePerDay;
    private BigDecimal securityDeposit;
    private String location;
    private String availabilityStatus;
    private List<ItemImageDto> images;
    private Double averageRating;
    private Long totalReviews;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
