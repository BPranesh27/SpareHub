package com.sharespare;

import com.sharespare.dto.request.CreateBookingRequest;
import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.UserDto;
import com.sharespare.entity.BookingStatus;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.BookingService;
import com.sharespare.service.ItemService;
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
class BookingServiceTests {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserService userService;

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

    @BeforeEach
    void setUp() {
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
    }

    @Test
    @DisplayName("1. Successful booking creation & financial derivation")
    void testSuccessfulBooking() {
        LocalDate start = LocalDate.now().plusDays(2);
        LocalDate end = LocalDate.now().plusDays(5); // 3 days

        BookingDto booking = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(start)
                .endDate(end)
                .build());

        assertNotNull(booking.getId());
        assertNotNull(booking.getBookingReference());
        assertEquals(3, booking.getRentalDays());
        assertEquals(new BigDecimal("3000.00"), booking.getRentalAmount()); // 3 * 1000
        assertEquals(new BigDecimal("5000.00"), booking.getDepositAmount());
        assertEquals(new BigDecimal("8000.00"), booking.getTotalAmount());
        assertEquals(BookingStatus.PENDING, booking.getStatus());
    }

    @Test
    @DisplayName("2. Unknown item rejection")
    void testUnknownItemRejection() {
        assertThrows(ResourceNotFoundException.class, () ->
                bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                        .itemId(9999L)
                        .startDate(LocalDate.now().plusDays(1))
                        .endDate(LocalDate.now().plusDays(3))
                        .build())
        );
    }

    @Test
    @DisplayName("3. Self-booking rejection (Lender renting own item)")
    void testSelfBookingRejection() {
        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(lender.getEmail(), CreateBookingRequest.builder()
                        .itemId(item.getId())
                        .startDate(LocalDate.now().plusDays(1))
                        .endDate(LocalDate.now().plusDays(3))
                        .build())
        );
    }

    @Test
    @DisplayName("4. Past start date rejection")
    void testPastDateRejection() {
        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                        .itemId(item.getId())
                        .startDate(LocalDate.now().minusDays(2))
                        .endDate(LocalDate.now().plusDays(2))
                        .build())
        );
    }

    @Test
    @DisplayName("5. Invalid date range (end <= start) rejection")
    void testInvalidDateRangeRejection() {
        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                        .itemId(item.getId())
                        .startDate(LocalDate.now().plusDays(5))
                        .endDate(LocalDate.now().plusDays(2))
                        .build())
        );
    }

    @Test
    @DisplayName("6. Date overlap logic: Exact overlap rejection")
    void testExactOverlapRejection() {
        LocalDate start = LocalDate.now().plusDays(10);
        LocalDate end = LocalDate.now().plusDays(15);

        bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(start)
                .endDate(end)
                .build());

        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(stranger.getEmail(), CreateBookingRequest.builder()
                        .itemId(item.getId())
                        .startDate(start)
                        .endDate(end)
                        .build())
        );
    }

    @Test
    @DisplayName("7. Date overlap logic: Partial overlap rejection")
    void testPartialOverlapRejection() {
        LocalDate start1 = LocalDate.now().plusDays(10);
        LocalDate end1 = LocalDate.now().plusDays(15);

        bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(start1)
                .endDate(end1)
                .build());

        // New booking: Day 12 to Day 17 (overlaps Day 12 to 15)
        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(stranger.getEmail(), CreateBookingRequest.builder()
                        .itemId(item.getId())
                        .startDate(LocalDate.now().plusDays(12))
                        .endDate(LocalDate.now().plusDays(17))
                        .build())
        );
    }

    @Test
    @DisplayName("8. Date overlap logic: Adjacent non-overlapping booking ALLOWED")
    void testAdjacentBookingAllowed() {
        LocalDate start1 = LocalDate.now().plusDays(10);
        LocalDate end1 = LocalDate.now().plusDays(15);

        bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(start1)
                .endDate(end1)
                .build());

        // Adjacent booking starting on existing end date (Day 15 to Day 20)
        BookingDto adjacentBooking = bookingService.createBooking(stranger.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(end1)
                .endDate(LocalDate.now().plusDays(20))
                .build());

        assertNotNull(adjacentBooking.getId());
        assertEquals(end1, adjacentBooking.getStartDate());
    }

    @Test
    @DisplayName("9. Booking Authorization: Renter and Lender can view, Stranger rejected")
    void testBookingAccessAuthorization() {
        BookingDto booking = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .build());

        // Renter view
        assertNotNull(bookingService.getBookingById(renter.getEmail(), booking.getId()));

        // Lender view
        assertNotNull(bookingService.getBookingById(lender.getEmail(), booking.getId()));

        // Unrelated stranger view -> BadRequestException
        assertThrows(BadRequestException.class, () ->
                bookingService.getBookingById(stranger.getEmail(), booking.getId())
        );
    }

    @Test
    @DisplayName("10. Booking Cancellation workflow & authorization")
    void testBookingCancellation() {
        BookingDto booking = bookingService.createBooking(renter.getEmail(), CreateBookingRequest.builder()
                .itemId(item.getId())
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .build());

        // Stranger cannot cancel -> BadRequestException
        assertThrows(BadRequestException.class, () ->
                bookingService.cancelBooking(stranger.getEmail(), booking.getId())
        );

        // Renter cancels
        BookingDto cancelled = bookingService.cancelBooking(renter.getEmail(), booking.getId());
        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());

        // Cancelling already cancelled booking -> BadRequestException
        assertThrows(BadRequestException.class, () ->
                bookingService.cancelBooking(renter.getEmail(), booking.getId())
        );
    }
}
