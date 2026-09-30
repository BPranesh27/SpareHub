package com.sharespare;

import com.sharespare.dto.response.AnalyticsSummaryDto;
import com.sharespare.dto.response.ItemPerformanceDto;
import com.sharespare.dto.response.RevenueTrendDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.AnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AnalyticsServiceTests {

    @Autowired
    private AnalyticsService analyticsService;

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

    private User lenderA;
    private User lenderB;
    private User renter;
    private Item itemA1;
    private Item itemA2;
    private Item itemB1;

    private Booking completedBooking1;
    private Booking activeBooking2;
    private Booking cancelledBooking3;

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        handoverRepository.deleteAll();
        damageReportRepository.deleteAll();
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        itemRepository.deleteAll();
        userRepository.deleteAll();

        lenderA = userRepository.save(User.builder()
                .name("Lender Alpha")
                .email("lender_alpha@example.com")
                .password("Password123!")
                .phone("1111111111")
                .build());

        lenderB = userRepository.save(User.builder()
                .name("Lender Beta")
                .email("lender_beta@example.com")
                .password("Password123!")
                .phone("2222222222")
                .build());

        renter = userRepository.save(User.builder()
                .name("Analytics Renter")
                .email("renter_analytics@example.com")
                .password("Password123!")
                .phone("3333333333")
                .build());

        itemA1 = itemRepository.save(Item.builder()
                .lender(lenderA)
                .name("DSLR Camera Pro")
                .category("Electronics")
                .description("Professional camera")
                .pricePerDay(new BigDecimal("100.00"))
                .securityDeposit(new BigDecimal("300.00"))
                .location("New York")
                .availabilityStatus("AVAILABLE")
                .build());

        itemA2 = itemRepository.save(Item.builder()
                .lender(lenderA)
                .name("Power Generator")
                .category("Tools")
                .description("Heavy duty generator")
                .pricePerDay(new BigDecimal("150.00"))
                .securityDeposit(new BigDecimal("400.00"))
                .location("New York")
                .availabilityStatus("AVAILABLE")
                .build());

        itemB1 = itemRepository.save(Item.builder()
                .lender(lenderB)
                .name("Lender B Drone")
                .category("Electronics")
                .description("4K Quadcopter")
                .pricePerDay(new BigDecimal("200.00"))
                .securityDeposit(new BigDecimal("500.00"))
                .location("Boston")
                .availabilityStatus("AVAILABLE")
                .build());

        completedBooking1 = bookingRepository.save(Booking.builder()
                .bookingReference("AN-COMP-001")
                .item(itemA1)
                .renter(renter)
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().minusDays(5))
                .rentalAmount(new BigDecimal("500.00"))
                .depositAmount(new BigDecimal("300.00"))
                .totalAmount(new BigDecimal("800.00"))
                .status(BookingStatus.COMPLETED)
                .build());

        paymentRepository.save(Payment.builder()
                .paymentReference("PAY-AN-001")
                .transactionReference("TXN-AN-001")
                .booking(completedBooking1)
                .amount(new BigDecimal("800.00"))
                .currency("INR")
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .status(PaymentStatus.SUCCESS)
                .damageDeduction(new BigDecimal("50.00"))
                .refundAmount(new BigDecimal("250.00"))
                .refundedAt(LocalDateTime.now())
                .build());

        reviewRepository.save(Review.builder()
                .booking(completedBooking1)
                .reviewer(renter)
                .item(itemA1)
                .rating(5)
                .comment("Outstanding camera!")
                .build());

        activeBooking2 = bookingRepository.save(Booking.builder()
                .bookingReference("AN-ACT-002")
                .item(itemA2)
                .renter(renter)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(2))
                .rentalAmount(new BigDecimal("300.00"))
                .depositAmount(new BigDecimal("400.00"))
                .totalAmount(new BigDecimal("700.00"))
                .status(BookingStatus.ACTIVE)
                .build());

        cancelledBooking3 = bookingRepository.save(Booking.builder()
                .bookingReference("AN-CAN-003")
                .item(itemA1)
                .renter(renter)
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(7))
                .rentalAmount(new BigDecimal("200.00"))
                .depositAmount(new BigDecimal("300.00"))
                .totalAmount(new BigDecimal("500.00"))
                .status(BookingStatus.CANCELLED)
                .build());
    }

    @Test
    @DisplayName("1. Empty lender state")
    void emptyLenderState() {
        User emptyLender = userRepository.save(User.builder()
                .name("Empty Lender")
                .email("empty_lender@example.com")
                .password("Password123!")
                .phone("0000000000")
                .build());

        AnalyticsSummaryDto summary = analyticsService.getSummary(emptyLender.getEmail());
        assertEquals(0L, summary.getTotalItems());
        assertEquals(0L, summary.getTotalBookings());
        assertEquals(BigDecimal.ZERO, summary.getTotalRevenue());
        assertEquals(0.0, summary.getAverageRating());
    }

    @Test
    @DisplayName("2. Items with no bookings")
    void itemsWithNoBookings() {
        User newLender = userRepository.save(User.builder()
                .name("New Lender")
                .email("new_lender@example.com")
                .password("Password123!")
                .phone("9999999999")
                .build());

        itemRepository.save(Item.builder()
                .lender(newLender)
                .name("Unbooked Item")
                .category("Tools")
                .description("Fresh listing")
                .pricePerDay(new BigDecimal("30.00"))
                .securityDeposit(new BigDecimal("50.00"))
                .location("Chicago")
                .availabilityStatus("AVAILABLE")
                .build());

        AnalyticsSummaryDto summary = analyticsService.getSummary(newLender.getEmail());
        assertEquals(1L, summary.getTotalItems());
        assertEquals(0L, summary.getTotalBookings());
        assertEquals(BigDecimal.ZERO, summary.getTotalRevenue());
    }

    @Test
    @DisplayName("3. Total items")
    void totalItems() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(2L, summary.getTotalItems());
    }

    @Test
    @DisplayName("4. Total bookings")
    void totalBookings() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(3L, summary.getTotalBookings());
    }

    @Test
    @DisplayName("5. Active rentals")
    void activeRentals() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(1L, summary.getActiveRentals());
    }

    @Test
    @DisplayName("6. Completed rentals")
    void completedRentals() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(1L, summary.getCompletedRentals());
    }

    @Test
    @DisplayName("7. Cancelled bookings")
    void cancelledBookings() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(1L, summary.getCancelledBookings());
    }

    @Test
    @DisplayName("8. Revenue")
    void revenueCalculation() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(0, new BigDecimal("500.00").compareTo(summary.getTotalRevenue()));
    }

    @Test
    @DisplayName("9. Deposits")
    void depositCalculation() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        // completed (300) + active (400) = 700.00
        assertEquals(0, new BigDecimal("700.00").compareTo(summary.getTotalDeposits()));
    }

    @Test
    @DisplayName("10. Damage deductions")
    void damageDeductionCalculation() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(0, new BigDecimal("50.00").compareTo(summary.getTotalDamageDeductions()));
    }

    @Test
    @DisplayName("11. Refunds")
    void refundCalculation() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(0, new BigDecimal("250.00").compareTo(summary.getTotalRefunds()));
    }

    @Test
    @DisplayName("12. Average rating")
    void averageRatingCalculation() {
        AnalyticsSummaryDto summary = analyticsService.getSummary(lenderA.getEmail());
        assertEquals(5.0, summary.getAverageRating());
    }

    @Test
    @DisplayName("13. Item performance")
    void itemPerformanceBreakdown() {
        List<ItemPerformanceDto> items = analyticsService.getItemPerformance(lenderA.getEmail());
        assertEquals(2, items.size());

        ItemPerformanceDto dslrPerf = items.stream()
                .filter(i -> i.getItemId().equals(itemA1.getId()))
                .findFirst().orElseThrow();

        assertEquals(2L, dslrPerf.getTotalBookings());
        assertEquals(1L, dslrPerf.getCompletedBookings());
        assertEquals(1L, dslrPerf.getCancelledBookings());
        assertEquals(0, new BigDecimal("500.00").compareTo(dslrPerf.getTotalRevenue()));
        assertEquals(5.0, dslrPerf.getAverageRating());
        assertEquals(1L, dslrPerf.getTotalReviews());
    }

    @Test
    @DisplayName("14. Monthly revenue trend")
    void monthlyRevenueTrend() {
        List<RevenueTrendDto> trend = analyticsService.getRevenueTrend(lenderA.getEmail());
        assertFalse(trend.isEmpty());
        RevenueTrendDto latestMonth = trend.get(trend.size() - 1);
        assertNotNull(latestMonth.getPeriod());
        assertTrue(latestMonth.getBookingCount() > 0);
    }

    @Test
    @DisplayName("15. Top items")
    void topItemsCalculation() {
        Map<String, List<ItemPerformanceDto>> topItems = analyticsService.getTopItems(lenderA.getEmail());
        assertTrue(topItems.containsKey("mostBooked"));
        assertTrue(topItems.containsKey("highestRevenue"));
        assertTrue(topItems.containsKey("highestRated"));

        List<ItemPerformanceDto> mostBooked = topItems.get("mostBooked");
        assertFalse(mostBooked.isEmpty());
        assertEquals(itemA1.getId(), mostBooked.get(0).getItemId());
    }

    @Test
    @DisplayName("16. Lender isolation")
    void lenderIsolation() {
        AnalyticsSummaryDto summaryA = analyticsService.getSummary(lenderA.getEmail());
        AnalyticsSummaryDto summaryB = analyticsService.getSummary(lenderB.getEmail());

        assertEquals(2L, summaryA.getTotalItems());
        assertEquals(1L, summaryB.getTotalItems());

        assertEquals(3L, summaryA.getTotalBookings());
        assertEquals(0L, summaryB.getTotalBookings());

        assertEquals(0, new BigDecimal("500.00").compareTo(summaryA.getTotalRevenue()));
        assertEquals(0, BigDecimal.ZERO.compareTo(summaryB.getTotalRevenue()));
    }

    @Test
    @DisplayName("17. Unauthorized/security behavior")
    void unauthorizedAccessHandling() {
        assertThrows(ResourceNotFoundException.class,
                () -> analyticsService.getSummary("unknown_user@example.com"));

        assertThrows(BadRequestException.class,
                () -> analyticsService.getSummary(""));
    }
}
