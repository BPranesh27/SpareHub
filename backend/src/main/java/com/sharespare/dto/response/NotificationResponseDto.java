package com.sharespare.dto.response;

import com.sharespare.entity.NotificationType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponseDto {

    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Long relatedEntityId;
    private String relatedEntityType;
    private boolean isRead;
    private LocalDateTime createdAt;
}
