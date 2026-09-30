package com.sharespare.service.impl;

import com.sharespare.dto.response.NotificationResponseDto;
import com.sharespare.dto.response.NotificationSummaryDto;
import com.sharespare.entity.Notification;
import com.sharespare.entity.NotificationType;
import com.sharespare.entity.User;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.NotificationRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationResponseDto createNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            Long relatedEntityId,
            String relatedEntityType) {

        if (recipient == null) {
            throw new BadRequestException("Notification recipient cannot be null.");
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationSummaryDto getMyNotifications(String userEmail) {
        User user = getUser(userEmail);
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId());
        long unreadCount = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());

        List<NotificationResponseDto> dtos = notifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return NotificationSummaryDto.builder()
                .notifications(dtos)
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUser(userEmail);
        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public NotificationResponseDto markAsRead(Long notificationId, String userEmail) {
        User user = getUser(userEmail);

        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found or unauthorized for ID: " + notificationId));

        notification.setRead(true);
        Notification updated = notificationRepository.save(notification);
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = getUser(userEmail);
        notificationRepository.markAllAsReadByRecipientId(user.getId());
    }

    private User getUser(String email) {
        if (email == null || email.isBlank()) {
            throw new BadRequestException("Unauthorized: Authentication user email is required.");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private NotificationResponseDto mapToDto(Notification n) {
        return NotificationResponseDto.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .relatedEntityId(n.getRelatedEntityId())
                .relatedEntityType(n.getRelatedEntityType())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
