package com.sharespare.dto.response;

import com.sharespare.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDto {

    private Long id;
    private String bookingReference;
    private Long itemId;
    private String itemName;
    private String itemCategory;
    private String itemImage;
    private String location;
    private Long lenderId;
    private String lenderName;
    private String lenderEmail;
    private Long renterId;
    private String renterName;
    private String renterEmail;
    private LocalDate startDate;
    private LocalDate endDate;
    private long rentalDays;
    private BigDecimal pricePerDay;
    private BigDecimal rentalAmount;
    private BigDecimal depositAmount;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
