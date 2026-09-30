package com.sharespare.dto.request;

import jakarta.validation.constraints.*;
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
public class CreateItemRequest {

    @NotBlank(message = "Item name is required")
    @Size(min = 3, max = 200, message = "Item name must be between 3 and 200 characters")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    @NotNull(message = "Price per day is required")
    @DecimalMin(value = "1.0", message = "Price per day must be at least 1.0")
    private BigDecimal pricePerDay;

    @NotNull(message = "Security deposit is required")
    @DecimalMin(value = "0.0", message = "Security deposit cannot be negative")
    private BigDecimal securityDeposit;

    @NotBlank(message = "Location is required")
    private String location;

    @NotEmpty(message = "At least one image URL or photo is required")
    private List<String> imageUrls;
}
