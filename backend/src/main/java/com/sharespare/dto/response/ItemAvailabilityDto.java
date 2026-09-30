package com.sharespare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemAvailabilityDto {

    private Long itemId;
    private String itemName;
    private boolean isAvailable;
    private String message;
    private LocalDate startDate;
    private LocalDate endDate;
    private long rentalDays;
    private BigDecimal pricePerDay;
    private BigDecimal rentalAmount;
    private BigDecimal depositAmount;
    private BigDecimal totalAmount;
}
