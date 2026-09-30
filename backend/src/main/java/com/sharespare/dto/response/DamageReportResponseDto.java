package com.sharespare.dto.response;

import com.sharespare.entity.DamageReportStatus;
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
public class DamageReportResponseDto {

    private Long id;
    private Long bookingId;
    private String bookingReference;
    private BigDecimal damageAmount;
    private BigDecimal depositAmount;
    private BigDecimal refundAmount;
    private String description;
    private DamageReportStatus status;
    private LocalDateTime inspectedAt;
    private LocalDateTime createdAt;
    private List<DamageEvidenceDto> evidences;
}
