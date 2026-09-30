package com.sharespare;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.ProcessPaymentRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.PaymentHistoryResponseDto;
import com.sharespare.dto.response.PaymentResponseDto;
import com.sharespare.dto.response.UserDto;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.PaymentMethod;
import com.sharespare.entity.PaymentStatus;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.PaymentRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.BookingService;
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
class PaymentServiceTests {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserService userService;

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
    private BookingDto booking;

    @BeforeEach
    void setUp() {
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

        booking = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(LocalDate.now().plusDays(2))
                .endDate(LocalDate.now().plusDays(5)) // 3 days: rental = 3000, deposit = 5000, total = 8000
                .build());
    }

    @Test
    @DisplayName("1. Valid payment succeeds, generates references & confirms booking")
    void testSuccessfulPaymentProcessing() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build();

        PaymentResponseDto response = paymentService.processPayment(renter.getEmail(), request);

        assertNotNull(response);
        assertTrue(response.getPaymentReference().startsWith("PAY-"));
        assertTrue(response.getTransactionReference().startsWith("TXN-"));
        assertEquals(PaymentStatus.SUCCESS, response.getStatus());
        assertEquals(new BigDecimal("8000.00"), response.getAmount());
        assertEquals(PaymentMethod.MOCK_CARD, response.getPaymentMethod());

        // Verify booking status was updated to CONFIRMED
        BookingDto updatedBooking = bookingService.getBookingById(renter.getEmail(), booking.getId());
        assertEquals(BookingStatus.CONFIRMED, updatedBooking.getStatus());
    }

    @Test
    @DisplayName("2. Mock payment failure does NOT confirm booking")
    void testFailedPaymentProcessing() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_UPI)
                .testFailure(true)
                .build();

        PaymentResponseDto response = paymentService.processPayment(renter.getEmail(), request);

        assertNotNull(response);
        assertTrue(response.getPaymentReference().startsWith("PAY-"));
        assertNull(response.getTransactionReference());
        assertEquals(PaymentStatus.FAILED, response.getStatus());

        // Verify booking status remains PENDING
        BookingDto updatedBooking = bookingService.getBookingById(renter.getEmail(), booking.getId());
        assertEquals(BookingStatus.PENDING, updatedBooking.getStatus());
    }

    @Test
    @DisplayName("3. Duplicate payment protection prevents second successful payment")
    void testDuplicatePaymentProtection() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build();

        // First payment succeeds
        paymentService.processPayment(renter.getEmail(), request);

        // Second payment attempt throws BadRequestException
        assertThrows(BadRequestException.class, () ->
                paymentService.processPayment(renter.getEmail(), request)
        );
    }

    @Test
    @DisplayName("4. Authorization guard: Lender and stranger cannot pay for renter's booking")
    void testPaymentAuthorizationGuard() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_NET_BANKING)
                .build();

        // Lender attempt rejected
        assertThrows(BadRequestException.class, () ->
                paymentService.processPayment(lender.getEmail(), request)
        );

        // Stranger attempt rejected
        assertThrows(BadRequestException.class, () ->
                paymentService.processPayment(stranger.getEmail(), request)
        );
    }

    @Test
    @DisplayName("5. Non-existent booking payment rejection")
    void testNonExistentBookingPayment() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(9999L)
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build();

        assertThrows(ResourceNotFoundException.class, () ->
                paymentService.processPayment(renter.getEmail(), request)
        );
    }

    @Test
    @DisplayName("6. Payment history retrieval & authorization")
    void testPaymentHistoryRetrieval() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build();

        paymentService.processPayment(renter.getEmail(), request);

        // Renter history contains 1 payment
        PaymentHistoryResponseDto renterHistory = paymentService.getPaymentHistory(renter.getEmail());
        assertEquals(1, renterHistory.getTotalCount());
        assertEquals(PaymentStatus.SUCCESS, renterHistory.getPayments().get(0).getStatus());

        // Stranger history is empty
        PaymentHistoryResponseDto strangerHistory = paymentService.getPaymentHistory(stranger.getEmail());
        assertEquals(0, strangerHistory.getTotalCount());
    }

    @Test
    @DisplayName("7. Booking payment detail authorization: Renter & Lender allowed, Stranger rejected")
    void testBookingPaymentDetailAuthorization() {
        ProcessPaymentRequest request = ProcessPaymentRequest.builder()
                .bookingId(booking.getId())
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .build();

        paymentService.processPayment(renter.getEmail(), request);

        // Renter can fetch booking payment
        assertNotNull(paymentService.getBookingPayment(renter.getEmail(), booking.getId()));

        // Lender can fetch booking payment
        assertNotNull(paymentService.getBookingPayment(lender.getEmail(), booking.getId()));

        // Stranger is rejected
        assertThrows(BadRequestException.class, () ->
                paymentService.getBookingPayment(stranger.getEmail(), booking.getId())
        );
    }
}
