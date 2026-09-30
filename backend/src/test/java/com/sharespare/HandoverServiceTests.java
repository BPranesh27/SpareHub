package com.sharespare;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.ProcessPaymentRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.request.VerifyHandoverRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.HandoverResponseDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.UserDto;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.HandoverStatus;
import com.sharespare.entity.PaymentMethod;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.HandoverRepository;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.PaymentRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.BookingService;
import com.sharespare.service.HandoverService;
import com.sharespare.service.ItemService;
import com.sharespare.service.PaymentService;
import com.sharespare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class HandoverServiceTests {

    @Autowired
    private HandoverService handoverService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserService userService;

    @Autowired
    private HandoverRepository handoverRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    private UserDto lender;
    private UserDto renter;
    private UserDto stranger;
    private ItemDto item;
    private BookingDto pendingBooking;
    private BookingDto confirmedBooking;

    @BeforeEach
    void setUp() {
        handoverRepository.deleteAll();
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        itemRepository.deleteAll();
        userRepository.deleteAll();

        lender = userService.registerUser(RegisterRequest.builder()
                .name("Alice Lender")
                .email("alice@lender.com")
                .password("Password123!")
                .build());

        renter = userService.registerUser(RegisterRequest.builder()
                .name("Bob Renter")
                .email("bob@renter.com")
                .password("Password123!")
                .build());

        stranger = userService.registerUser(RegisterRequest.builder()
                .name("Charlie Stranger")
                .email("charlie@stranger.com")
                .password("Password123!")
                .build());

        item = itemService.createItem(lender.getEmail(), CreateItemRequest.builder()
                .name("Sony FX3 Cinema Camera")
                .category("Electronics")
                .description("4K Full Frame Cinema Line Camera")
                .pricePerDay(new BigDecimal("1000.00"))
                .securityDeposit(new BigDecimal("5000.00"))
                .location("Coimbatore, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1516035069371-29a1b244cc32"))
                .build());

        // Booking 1: Remains PENDING (unpaid)
        pendingBooking = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(LocalDate.now().plusDays(2))
                .endDate(LocalDate.now().plusDays(5))
                .build());

        // Booking 2: Paid and CONFIRMED
        BookingDto temp = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(15))
                .build());

        paymentService.processPayment(renter.getEmail(), ProcessPaymentRequest.builder()
                .bookingId(temp.getId())
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build());

        confirmedBooking = bookingService.getBookingById(renter.getEmail(), temp.getId());
        assertEquals(BookingStatus.CONFIRMED, confirmedBooking.getStatus());
    }

    @Test
    @DisplayName("1. Lender can generate token for eligible CONFIRMED booking")
    void testLenderGenerateToken() {
        HandoverResponseDto handover = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        assertNotNull(handover);
        assertNotNull(handover.getHandoverToken());
        assertTrue(handover.getHandoverToken().startsWith("SS-HO-"));
        assertEquals(HandoverStatus.PENDING, handover.getStatus());
        assertEquals(confirmedBooking.getId(), handover.getBookingId());
    }

    @Test
    @DisplayName("2. Same booking returns same existing PENDING token (idempotent)")
    void testIdempotentTokenRetrieval() {
        HandoverResponseDto h1 = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());
        HandoverResponseDto h2 = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        assertEquals(h1.getHandoverToken(), h2.getHandoverToken());
        assertEquals(h1.getId(), h2.getId());
    }

    @Test
    @DisplayName("3. Renter cannot generate lender QR code")
    void testRenterCannotGenerateQR() {
        assertThrows(BadRequestException.class, () ->
                handoverService.getOrCreateHandover(renter.getEmail(), confirmedBooking.getId())
        );
    }

    @Test
    @DisplayName("4. Unrelated user cannot generate QR code")
    void testStrangerCannotGenerateQR() {
        assertThrows(BadRequestException.class, () ->
                handoverService.getOrCreateHandover(stranger.getEmail(), confirmedBooking.getId())
        );
    }

    @Test
    @DisplayName("5. Token generation fails when booking is PENDING")
    void testTokenGenFailsUnconfirmedBooking() {
        assertThrows(BadRequestException.class, () ->
                handoverService.getOrCreateHandover(lender.getEmail(), pendingBooking.getId())
        );
    }

    @Test
    @DisplayName("6. Token generation fails when payment is not SUCCESS")
    void testTokenGenFailsWithoutPayment() {
        assertThrows(BadRequestException.class, () ->
                handoverService.getOrCreateHandover(lender.getEmail(), pendingBooking.getId())
        );
    }

    @Test
    @DisplayName("7 & 8. Correct renter verifies token: Handover -> VERIFIED, Booking -> ACTIVE")
    void testRenterVerifyToken() {
        HandoverResponseDto h = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        VerifyHandoverRequest req = VerifyHandoverRequest.builder()
                .token(h.getHandoverToken())
                .build();

        HandoverResponseDto verified = handoverService.verifyHandover(renter.getEmail(), req);

        assertEquals(HandoverStatus.VERIFIED, verified.getStatus());
        assertNotNull(verified.getVerifiedAt());

        // Check Booking Status updated to ACTIVE
        BookingDto updatedBooking = bookingService.getBookingById(renter.getEmail(), confirmedBooking.getId());
        assertEquals(BookingStatus.ACTIVE, updatedBooking.getStatus());
    }

    @Test
    @DisplayName("9. Lender cannot verify renter handover token")
    void testLenderCannotVerifyToken() {
        HandoverResponseDto h = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        VerifyHandoverRequest req = VerifyHandoverRequest.builder()
                .token(h.getHandoverToken())
                .build();

        assertThrows(BadRequestException.class, () ->
                handoverService.verifyHandover(lender.getEmail(), req)
        );
    }

    @Test
    @DisplayName("10. Unrelated user cannot verify token")
    void testStrangerCannotVerifyToken() {
        HandoverResponseDto h = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        VerifyHandoverRequest req = VerifyHandoverRequest.builder()
                .token(h.getHandoverToken())
                .build();

        assertThrows(BadRequestException.class, () ->
                handoverService.verifyHandover(stranger.getEmail(), req)
        );
    }

    @Test
    @DisplayName("11. Invalid token is rejected")
    void testInvalidTokenRejection() {
        VerifyHandoverRequest req = VerifyHandoverRequest.builder()
                .token("SS-HO-invalid-token-1234")
                .build();

        assertThrows(ResourceNotFoundException.class, () ->
                handoverService.verifyHandover(renter.getEmail(), req)
        );
    }

    @Test
    @DisplayName("12. Already verified token cannot be verified again")
    void testAlreadyVerifiedTokenRejection() {
        HandoverResponseDto h = handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        VerifyHandoverRequest req = VerifyHandoverRequest.builder()
                .token(h.getHandoverToken())
                .build();

        // First verification succeeds
        handoverService.verifyHandover(renter.getEmail(), req);

        // Second verification attempt fails
        assertThrows(BadRequestException.class, () ->
                handoverService.verifyHandover(renter.getEmail(), req)
        );
    }

    @Test
    @DisplayName("13 & 14 & 15. Handover status access control: Renter & Lender allowed, Stranger rejected")
    void testHandoverStatusAccessControl() {
        handoverService.getOrCreateHandover(lender.getEmail(), confirmedBooking.getId());

        // 13. Renter can view status
        assertNotNull(handoverService.getHandoverStatus(renter.getEmail(), confirmedBooking.getId()));

        // 14. Lender can view status
        assertNotNull(handoverService.getHandoverStatus(lender.getEmail(), confirmedBooking.getId()));

        // 15. Stranger is rejected
        assertThrows(BadRequestException.class, () ->
                handoverService.getHandoverStatus(stranger.getEmail(), confirmedBooking.getId())
        );
    }
}
