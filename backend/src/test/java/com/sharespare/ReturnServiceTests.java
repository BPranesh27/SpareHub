package com.sharespare;

import com.sharespare.dto.request.CreateDamageReportRequest;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.DamageReportResponseDto;
import com.sharespare.dto.response.ReturnSummaryResponseDto;
import com.sharespare.entity.*;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.*;
import com.sharespare.service.ReturnService;
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
class ReturnServiceTests {

    @Autowired
    private ReturnService returnService;

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
    private Booking activeBooking;

    @BeforeEach
    void setUp() {
        handoverRepository.deleteAll();
        damageReportRepository.deleteAll();
        paymentRepository.deleteAll();
        bookingRepository.deleteAll();
        itemRepository.deleteAll();
        userRepository.deleteAll();

        lender = userRepository.save(User.builder()
                .name("Return Lender")
                .email("lender_return@example.com")
                .password("Password123!")
                .phone("1111111111")
                .build());

        renter = userRepository.save(User.builder()
                .name("Return Renter")
                .email("renter_return@example.com")
                .password("Password123!")
                .phone("2222222222")
                .build());

        stranger = userRepository.save(User.builder()
                .name("Return Stranger")
                .email("stranger_return@example.com")
                .password("Password123!")
                .phone("3333333333")
                .build());

        item = itemRepository.save(Item.builder()
                .name("DeWalt Rotary Hammer")
                .description("Heavy duty rotary hammer drill")
                .category("TOOLS")
                .pricePerDay(new BigDecimal("50.00"))
                .securityDeposit(new BigDecimal("2000.00"))
                .location("Chennai, TN")
                .availabilityStatus("RANTED")
                .lender(lender)
                .build());

        activeBooking = bookingRepository.save(Booking.builder()
                .bookingReference("SS-RET-001")
                .item(item)
                .renter(renter)
                .startDate(LocalDate.now().minusDays(2))
                .endDate(LocalDate.now().plusDays(1))
                .rentalAmount(new BigDecimal("150.00"))
                .depositAmount(new BigDecimal("2000.00"))
                .totalAmount(new BigDecimal("2150.00"))
                .status(BookingStatus.ACTIVE)
                .build());

        paymentRepository.save(Payment.builder()
                .paymentReference("PAY-RET-001")
                .transactionReference("TXN-RET-001")
                .booking(activeBooking)
                .amount(new BigDecimal("2150.00"))
                .currency("INR")
                .paymentMethod(PaymentMethod.MOCK_CARD)
                .status(PaymentStatus.SUCCESS)
                .build());
    }

    @Test
    @DisplayName("1. ACTIVE booking -> return request succeeds")
    void testActiveBookingReturnRequestSucceeds() {
        BookingDto dto = returnService.requestReturn(renter.getEmail(), activeBooking.getId());
        assertNotNull(dto);
        assertEquals(BookingStatus.RETURN_REQUESTED, dto.getStatus());
    }

    @Test
    @DisplayName("2. Non-renter cannot request return")
    void testNonRenterCannotRequestReturn() {
        assertThrows(BadRequestException.class, () ->
                returnService.requestReturn(lender.getEmail(), activeBooking.getId())
        );

        assertThrows(BadRequestException.class, () ->
                returnService.requestReturn(stranger.getEmail(), activeBooking.getId())
        );
    }

    @Test
    @DisplayName("3. Non-ACTIVE booking cannot request return")
    void testNonActiveBookingCannotRequestReturn() {
        activeBooking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(activeBooking);

        assertThrows(BadRequestException.class, () ->
                returnService.requestReturn(renter.getEmail(), activeBooking.getId())
        );
    }

    @Test
    @DisplayName("4. Duplicate return request rejected")
    void testDuplicateReturnRequestRejected() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        assertThrows(BadRequestException.class, () ->
                returnService.requestReturn(renter.getEmail(), activeBooking.getId())
        );
    }

    @Test
    @DisplayName("5. Lender can create damage inspection")
    void testLenderCanCreateDamageInspection() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("500.00"))
                .description("Scratched casing")
                .imageUrls(List.of("https://example.com/evidence1.jpg"))
                .build();

        DamageReportResponseDto report = returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        assertNotNull(report);
        assertEquals(new BigDecimal("500.00"), report.getDamageAmount());
        assertEquals(new BigDecimal("1500.00"), report.getRefundAmount());
        assertEquals(DamageReportStatus.INSPECTED, report.getStatus());
        assertEquals(1, report.getEvidences().size());
    }

    @Test
    @DisplayName("6. Non-lender cannot create damage inspection")
    void testNonLenderCannotCreateDamageInspection() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("100.00"))
                .description("Minor scratch")
                .build();

        assertThrows(BadRequestException.class, () ->
                returnService.submitDamageInspection(renter.getEmail(), activeBooking.getId(), request)
        );

        assertThrows(BadRequestException.class, () ->
                returnService.submitDamageInspection(stranger.getEmail(), activeBooking.getId(), request)
        );
    }

    @Test
    @DisplayName("7. Damage = 0 -> full deposit refund")
    void testZeroDamageFullRefund() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(BigDecimal.ZERO)
                .description("No damage, clean return")
                .build();

        DamageReportResponseDto report = returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        assertEquals(BigDecimal.ZERO, report.getDamageAmount());
        assertEquals(new BigDecimal("2000.00"), report.getRefundAmount());
    }

    @Test
    @DisplayName("8. Damage < deposit -> partial refund")
    void testPartialRefund() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("750.00"))
                .description("Chipped drill bit")
                .build();

        DamageReportResponseDto report = returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        assertEquals(new BigDecimal("750.00"), report.getDamageAmount());
        assertEquals(new BigDecimal("1250.00"), report.getRefundAmount());
    }

    @Test
    @DisplayName("9. Damage = deposit -> refund 0")
    void testDamageEqualsDepositZeroRefund() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("2000.00"))
                .description("Tool completely destroyed")
                .build();

        DamageReportResponseDto report = returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        assertEquals(new BigDecimal("2000.00"), report.getDamageAmount());
        assertEquals(BigDecimal.ZERO.setScale(2), report.getRefundAmount().setScale(2));
    }

    @Test
    @DisplayName("10. Damage > deposit -> rejected")
    void testDamageExceedingDepositRejected() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("3000.00"))
                .description("Exceeds deposit")
                .build();

        assertThrows(BadRequestException.class, () ->
                returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request)
        );
    }

    @Test
    @DisplayName("11. Negative damage -> rejected")
    void testNegativeDamageRejected() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("-100.00"))
                .description("Invalid negative amount")
                .build();

        assertThrows(BadRequestException.class, () ->
                returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request)
        );
    }

    @Test
    @DisplayName("12. Unauthorized user cannot access damage report")
    void testUnauthorizedUserCannotAccessDamageReport() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());
        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(BigDecimal.ZERO)
                .build();
        returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        assertThrows(BadRequestException.class, () ->
                returnService.getDamageReport(stranger.getEmail(), activeBooking.getId())
        );

        // Authorized renter and lender can access
        assertNotNull(returnService.getDamageReport(renter.getEmail(), activeBooking.getId()));
        assertNotNull(returnService.getDamageReport(lender.getEmail(), activeBooking.getId()));
    }

    @Test
    @DisplayName("13. Return completion changes status correctly")
    void testReturnCompletionChangesStatus() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("200.00"))
                .description("Minor dent")
                .build();
        returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        BookingDto completed = returnService.completeReturn(lender.getEmail(), activeBooking.getId());

        assertEquals(BookingStatus.COMPLETED, completed.getStatus());

        // Check item is available again
        Item updatedItem = itemRepository.findById(item.getId()).orElseThrow();
        assertEquals("AVAILABLE", updatedItem.getAvailabilityStatus());
    }

    @Test
    @DisplayName("14. Invalid booking status transition rejected")
    void testInvalidStatusTransitionRejected() {
        // Cannot complete return when status is ACTIVE
        assertThrows(BadRequestException.class, () ->
                returnService.completeReturn(lender.getEmail(), activeBooking.getId())
        );
    }

    @Test
    @DisplayName("15. Refund calculation is correct")
    void testRefundCalculationIsCorrect() {
        returnService.requestReturn(renter.getEmail(), activeBooking.getId());

        CreateDamageReportRequest request = CreateDamageReportRequest.builder()
                .damageAmount(new BigDecimal("400.00"))
                .description("Scratches")
                .build();
        returnService.submitDamageInspection(lender.getEmail(), activeBooking.getId(), request);

        ReturnSummaryResponseDto summary = returnService.getReturnSummary(renter.getEmail(), activeBooking.getId());

        assertNotNull(summary);
        assertEquals(new BigDecimal("2000.00"), summary.getOriginalDeposit());
        assertEquals(new BigDecimal("400.00"), summary.getDamageDeduction());
        assertEquals(new BigDecimal("1600.00"), summary.getFinalRefund());
        assertEquals(BookingStatus.RETURNED, summary.getBookingStatus());
    }
}
