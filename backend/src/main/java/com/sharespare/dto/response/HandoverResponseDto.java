package com.sharespare.dto.response;

import com.sharespare.entity.HandoverStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HandoverResponseDto {

    private Long id;
    private Long bookingId;
    private String bookingReference;
    private String handoverToken;
    private HandoverStatus status;
    private String qrPayload;
    private LocalDateTime generatedAt;
    private LocalDateTime verifiedAt;
    private String itemName;
    private String renterName;
    private String lenderName;
}
