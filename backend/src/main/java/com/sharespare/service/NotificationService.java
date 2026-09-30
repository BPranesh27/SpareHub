package com.sharespare.service;

import com.sharespare.dto.response.NotificationResponseDto;
import com.sharespare.dto.response.NotificationSummaryDto;
import com.sharespare.entity.NotificationType;
import com.sharespare.entity.User;

public interface NotificationService {

    NotificationResponseDto createNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            Long relatedEntityId,
            String relatedEntityType
    );

    NotificationSummaryDto getMyNotifications(String userEmail);

    long getUnreadCount(String userEmail);

    NotificationResponseDto markAsRead(Long notificationId, String userEmail);

    void markAllAsRead(String userEmail);
}
