package com.sharespare.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueTrendDto {

    private String period; // YYYY-MM
    private Long bookingCount;
    private BigDecimal revenue;
}
