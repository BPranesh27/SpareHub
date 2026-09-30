package com.sharespare;

import com.sharespare.dto.response.NotificationResponseDto;
import com.sharespare.dto.response.NotificationSummaryDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class NotificationServiceTests {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    private User lender;
    private User renter;
    private Item item;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();

        lender = User.builder()
                .name("Test Lender")
                .email("lender_notif_test@example.com")
                .password("password123")
                .build();
        lender = userRepository.save(lender);

        renter = User.builder()
                .name("Test Renter")
                .email("renter_notif_test@example.com")
                .password("password123")
                .build();
        renter = userRepository.save(renter);

        item = Item.builder()
                .name("Drill Kit")
                .description("Heavy duty drill")
                .category("TOOLS")
                .pricePerDay(new BigDecimal("25.00"))
                .securityDeposit(new BigDecimal("100.00"))
                .location("Downtown")
                .availabilityStatus("AVAILABLE")
                .lender(lender)
                .build();
        item = itemRepository.save(item);
    }

    @Test
    @DisplayName("1. Notification creation")
    void testNotificationCreation() {
        NotificationResponseDto created = notificationService.createNotification(
                lender,
                NotificationType.BOOKING_CREATED,
                "New Booking Request",
                "Someone requested your Drill Kit",
                100L,
                "BOOKING"
        );

        assertNotNull(created);
        assertNotNull(created.getId());
        assertEquals(NotificationType.BOOKING_CREATED, created.getType());
        assertEquals("New Booking Request", created.getTitle());
        assertFalse(created.isRead());
    }

    @Test
    @DisplayName("2. User isolation")
    void testUserIsolation() {
        NotificationResponseDto lenderNotif = notificationService.createNotification(
                lender,
                NotificationType.BOOKING_CREATED,
                "Lender Notification",
                "Lender message",
                101L,
                "BOOKING"
        );

        NotificationSummaryDto renterSummary = notificationService.getMyNotifications(renter.getEmail());
        assertEquals(0, renterSummary.getNotifications().size());
        assertEquals(0, renterSummary.getUnreadCount());

        NotificationSummaryDto lenderSummary = notificationService.getMyNotifications(lender.getEmail());
        assertEquals(1, lenderSummary.getNotifications().size());

        // Renter cannot mark Lender's notification as read
        assertThrows(ResourceNotFoundException.class, () ->
                notificationService.markAsRead(lenderNotif.getId(), renter.getEmail())
        );
    }

    @Test
    @DisplayName("3. Unread count")
    void testUnreadCount() {
        notificationService.createNotification(lender, NotificationType.BOOKING_CREATED, "N1", "M1", 1L, "BOOKING");
        notificationService.createNotification(lender, NotificationType.PAYMENT_SUCCESS, "N2", "M2", 2L, "PAYMENT");

        long count = notificationService.getUnreadCount(lender.getEmail());
        assertEquals(2, count);
    }

    @Test
    @DisplayName("4. Mark single notification as read")
    void testMarkSingleNotificationAsRead() {
        NotificationResponseDto notif = notificationService.createNotification(
                lender,
                NotificationType.BOOKING_CREATED,
                "Test Title",
                "Test Message",
                1L,
                "BOOKING"
        );

        NotificationResponseDto updated = notificationService.markAsRead(notif.getId(), lender.getEmail());
        assertTrue(updated.isRead());
        assertEquals(0, notificationService.getUnreadCount(lender.getEmail()));
    }

    @Test
    @DisplayName("5. Mark all notifications as read")
    void testMarkAllNotificationsAsRead() {
        notificationService.createNotification(renter, NotificationType.PAYMENT_SUCCESS, "T1", "M1", 1L, "PAYMENT");
        notificationService.createNotification(renter, NotificationType.HANDOVER_READY, "T2", "M2", 2L, "HANDOVER");

        assertEquals(2, notificationService.getUnreadCount(renter.getEmail()));

        notificationService.markAllAsRead(renter.getEmail());
        assertEquals(0, notificationService.getUnreadCount(renter.getEmail()));
    }

    @Test
    @DisplayName("6. Booking-created notification")
    void testBookingCreatedNotificationTrigger() {
        notificationService.createNotification(
                lender,
                NotificationType.BOOKING_CREATED,
                "New Booking Request",
                "Renter requested to rent your item",
                50L,
                "BOOKING"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(lender.getEmail()).getNotifications();
        assertEquals(1, list.size());
        assertEquals(NotificationType.BOOKING_CREATED, list.get(0).getType());
    }

    @Test
    @DisplayName("7. Payment-success notification")
    void testPaymentSuccessNotificationTrigger() {
        notificationService.createNotification(
                renter,
                NotificationType.PAYMENT_SUCCESS,
                "Payment Successful",
                "Your payment of ₹150.00 was processed successfully.",
                50L,
                "PAYMENT"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(renter.getEmail()).getNotifications();
        assertEquals(1, list.size());
        assertEquals(NotificationType.PAYMENT_SUCCESS, list.get(0).getType());
    }

    @Test
    @DisplayName("8. Booking-confirmed notification")
    void testBookingConfirmedNotificationTrigger() {
        notificationService.createNotification(
                lender,
                NotificationType.BOOKING_CONFIRMED,
                "Booking Confirmed",
                "Payment received! Booking for Drill Kit is confirmed.",
                50L,
                "BOOKING"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(lender.getEmail()).getNotifications();
        assertEquals(1, list.size());
        assertEquals(NotificationType.BOOKING_CONFIRMED, list.get(0).getType());
    }

    @Test
    @DisplayName("9. Handover notification")
    void testHandoverNotificationTrigger() {
        notificationService.createNotification(
                renter,
                NotificationType.HANDOVER_READY,
                "Handover QR Ready",
                "Your handover QR code is ready for scanning.",
                50L,
                "HANDOVER"
        );

        notificationService.createNotification(
                lender,
                NotificationType.HANDOVER_COMPLETED,
                "Handover Completed",
                "Handover verified. Rental is now active.",
                50L,
                "HANDOVER"
        );

        assertEquals(1, notificationService.getUnreadCount(renter.getEmail()));
        assertEquals(1, notificationService.getUnreadCount(lender.getEmail()));
    }

    @Test
    @DisplayName("10. Return notification")
    void testReturnRequestedNotificationTrigger() {
        notificationService.createNotification(
                lender,
                NotificationType.RETURN_REQUESTED,
                "Return Requested",
                "Renter requested to return Drill Kit.",
                50L,
                "BOOKING"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(lender.getEmail()).getNotifications();
        assertEquals(1, list.size());
        assertEquals(NotificationType.RETURN_REQUESTED, list.get(0).getType());
    }

    @Test
    @DisplayName("11. Refund/damage notification")
    void testRefundAndDamageNotificationTrigger() {
        notificationService.createNotification(
                renter,
                NotificationType.DAMAGE_REPORTED,
                "Damage Inspection Completed",
                "Damage inspection completed for Drill Kit. Damage amount: ₹20.00.",
                50L,
                "BOOKING"
        );

        notificationService.createNotification(
                renter,
                NotificationType.REFUND_PROCESSED,
                "Refund Processed",
                "Rental for Drill Kit completed. Refund of ₹80.00 processed.",
                50L,
                "BOOKING"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(renter.getEmail()).getNotifications();
        assertEquals(2, list.size());
        assertEquals(NotificationType.REFUND_PROCESSED, list.get(0).getType());
        assertEquals(NotificationType.DAMAGE_REPORTED, list.get(1).getType());
    }

    @Test
    @DisplayName("12. Review notification")
    void testReviewReceivedNotificationTrigger() {
        notificationService.createNotification(
                lender,
                NotificationType.REVIEW_RECEIVED,
                "New Review Received",
                "Test Renter left a 5-star review for Drill Kit.",
                item.getId(),
                "ITEM"
        );

        List<NotificationResponseDto> list = notificationService.getMyNotifications(lender.getEmail()).getNotifications();
        assertEquals(1, list.size());
        assertEquals(NotificationType.REVIEW_RECEIVED, list.get(0).getType());
    }
}
