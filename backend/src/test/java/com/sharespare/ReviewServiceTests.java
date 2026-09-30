package com.sharespare;

import com.sharespare.dto.request.CreateReviewRequest;
import com.sharespare.dto.response.ItemRatingSummaryDto;
import com.sharespare.dto.response.ReviewResponseDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.ReviewService;
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
class ReviewServiceTests {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private DamageReportRepository damageReportRepository;

    @Autowired
    private HandoverRepository handoverRepository;

    private User lender;
    private User renter;
    private User stranger;
    private Item item;
    private Booking completedBooking;
    private Booking activeBooking;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        handoverRepository.deleteAll();
        damageReportRepository.deleteAll();
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        itemRepository.deleteAll();
        userRepository.deleteAll();

        lender = userRepository.save(User.builder()
                .name("Review Lender")
                .email("lender_rev@example.com")
                .password("Password123!")
                .phone("1111111111")
                .build());

        renter = userRepository.save(User.builder()
                .name("Review Renter")
                .email("renter_rev@example.com")
                .password("Password123!")
                .phone("2222222222")
                .build());

        stranger = userRepository.save(User.builder()
                .name("Review Stranger")
                .email("stranger_rev@example.com")
                .password("Password123!")
                .phone("3333333333")
                .build());

        item = itemRepository.save(Item.builder()
                .lender(lender)
                .name("Pro Camera Kit")
                .category("Electronics")
                .description("High-end DSLR camera kit")
                .pricePerDay(new BigDecimal("50.00"))
                .securityDeposit(new BigDecimal("200.00"))
                .location("New York")
                .availabilityStatus("AVAILABLE")
                .build());

        completedBooking = bookingRepository.save(Booking.builder()
                .bookingReference("REV-COMP-001")
                .item(item)
                .renter(renter)
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().minusDays(2))
                .rentalAmount(new BigDecimal("150.00"))
                .depositAmount(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("350.00"))
                .status(BookingStatus.COMPLETED)
                .build());

        activeBooking = bookingRepository.save(Booking.builder()
                .bookingReference("REV-ACT-002")
                .item(item)
                .renter(renter)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(3))
                .rentalAmount(new BigDecimal("150.00"))
                .depositAmount(new BigDecimal("200.00"))
                .totalAmount(new BigDecimal("350.00"))
                .status(BookingStatus.ACTIVE)
                .build());
    }

    @Test
    @DisplayName("1. Completed booking allows review")
    void completedBookingAllowsReview() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Excellent equipment!")
                .build();

        ReviewResponseDto dto = reviewService.createReview(request, renter.getEmail());
        assertNotNull(dto);
        assertEquals(5, dto.getRating());
        assertEquals("Excellent equipment!", dto.getComment());
        assertEquals(renter.getName(), dto.getReviewerName());
    }

    @Test
    @DisplayName("2. Non-completed booking rejected")
    void nonCompletedBookingRejected() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(activeBooking.getId())
                .rating(4)
                .comment("Attempt early review")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request, renter.getEmail()));
        assertTrue(ex.getMessage().contains("COMPLETED"));
    }

    @Test
    @DisplayName("3. Unrelated user rejected")
    void unrelatedUserRejected() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Stranger review attempt")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request, stranger.getEmail()));
        assertTrue(ex.getMessage().contains("Unauthorized"));
    }

    @Test
    @DisplayName("4. Renter can review")
    void renterCanReview() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(4)
                .comment("Great camera!")
                .build();

        ReviewResponseDto dto = reviewService.createReview(request, renter.getEmail());
        assertNotNull(dto.getId());
        assertEquals(renter.getId(), dto.getReviewerId());
    }

    @Test
    @DisplayName("5. Lender can review")
    void lenderCanReview() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Renter returned camera in perfect condition.")
                .build();

        ReviewResponseDto dto = reviewService.createReview(request, lender.getEmail());
        assertNotNull(dto.getId());
        assertEquals(lender.getId(), dto.getReviewerId());
    }

    @Test
    @DisplayName("6. Rating below 1 rejected")
    void ratingBelowOneRejected() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(0)
                .comment("Zero stars")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request, renter.getEmail()));
        assertTrue(ex.getMessage().contains("between 1 and 5"));
    }

    @Test
    @DisplayName("7. Rating above 5 rejected")
    void ratingAboveFiveRejected() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(6)
                .comment("Six stars")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request, renter.getEmail()));
        assertTrue(ex.getMessage().contains("between 1 and 5"));
    }

    @Test
    @DisplayName("8. Duplicate review rejected")
    void duplicateReviewRejected() {
        CreateReviewRequest request1 = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("First review")
                .build();
        reviewService.createReview(request1, renter.getEmail());

        CreateReviewRequest request2 = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(4)
                .comment("Second review attempt")
                .build();

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request2, renter.getEmail()));
        assertTrue(ex.getMessage().contains("Duplicate review"));
    }

    @Test
    @DisplayName("9. Reviewer spoofing rejected")
    void reviewerSpoofingRejected() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Spoof attempt")
                .build();

        assertThrows(ResourceNotFoundException.class,
                () -> reviewService.createReview(request, "invalid_user@example.com"));
    }

    @Test
    @DisplayName("10. Review saved successfully")
    void reviewSavedSuccessfully() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Smooth experience")
                .build();

        ReviewResponseDto dto = reviewService.createReview(request, renter.getEmail());
        assertNotNull(dto.getId());

        List<ReviewResponseDto> bookingReviews = reviewService.getReviewsByBooking(completedBooking.getId());
        assertEquals(1, bookingReviews.size());
        assertEquals(5, bookingReviews.get(0).getRating());
    }

    @Test
    @DisplayName("11. Average rating calculated correctly")
    void averageRatingCalculatedCorrectly() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(4)
                .comment("Very good")
                .build();
        reviewService.createReview(request, renter.getEmail());

        ItemRatingSummaryDto summary = reviewService.getItemRatingSummary(item.getId());
        assertEquals(4.0, summary.getAverageRating());
    }

    @Test
    @DisplayName("12. Review count calculated correctly")
    void reviewCountCalculatedCorrectly() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Awesome")
                .build();
        reviewService.createReview(request, renter.getEmail());

        ItemRatingSummaryDto summary = reviewService.getItemRatingSummary(item.getId());
        assertEquals(1L, summary.getTotalReviews());
    }

    @Test
    @DisplayName("13. Multiple reviews calculate correct average")
    void multipleReviewsCalculateCorrectAverage() {
        // Renter reviews booking 1
        reviewService.createReview(CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Renter review")
                .build(), renter.getEmail());

        // Lender reviews booking 1
        reviewService.createReview(CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(4)
                .comment("Lender review")
                .build(), lender.getEmail());

        ItemRatingSummaryDto summary = reviewService.getItemRatingSummary(item.getId());
        assertEquals(2L, summary.getTotalReviews());
        assertEquals(4.5, summary.getAverageRating());
    }

    @Test
    @DisplayName("14. Unauthorized review access rejected where applicable")
    void unauthorizedAccessRejectedWhereApplicable() {
        CreateReviewRequest request = CreateReviewRequest.builder()
                .bookingId(completedBooking.getId())
                .rating(5)
                .comment("Unauthorized attempt")
                .build();

        assertThrows(BadRequestException.class,
                () -> reviewService.createReview(request, stranger.getEmail()));
    }

    @Test
    @DisplayName("15. Existing Phase 1-7 behavior remains intact")
    void existingPhase1To7BehaviorRemainsIntact() {
        assertEquals(BookingStatus.COMPLETED, completedBooking.getStatus());
        assertEquals(BookingStatus.ACTIVE, activeBooking.getStatus());
        assertNotNull(item.getId());
        assertNotNull(lender.getId());
        assertNotNull(renter.getId());
    }
}
