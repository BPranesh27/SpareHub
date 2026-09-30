package com.sharespare.dto.response;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationSummaryDto {

    private List<NotificationResponseDto> notifications;
    private long unreadCount;
}
