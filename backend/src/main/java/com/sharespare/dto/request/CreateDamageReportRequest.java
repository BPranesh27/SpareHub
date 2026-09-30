package com.sharespare.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDamageReportRequest {

    @NotNull(message = "Damage amount is required")
    @Min(value = 0, message = "Damage amount cannot be negative")
    private BigDecimal damageAmount;

    private String description;

    private List<String> imageUrls;
}
