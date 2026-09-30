package com.sharespare.config;

import com.sharespare.entity.*;
import com.sharespare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ItemRepository itemRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final HandoverRepository handoverRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking E2E seed data...");

        User lender = userRepository.findByEmail("lender_e2e@example.com").orElseGet(() -> {
            User u = User.builder()
                    .name("E2E Lender")
                    .email("lender_e2e@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("1234567890")
                    .build();
            return userRepository.save(u);
        });

        User renter = userRepository.findByEmail("renter_e2e@example.com").orElseGet(() -> {
            User u = User.builder()
                    .name("E2E Renter")
                    .email("renter_e2e@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .phone("0987654321")
                    .build();
            return userRepository.save(u);
        });

        if (itemRepository.count() == 0) {
            Item item = Item.builder()
                    .name("Professional Drill Kit")
                    .description("High performance cordless drill with battery pack")
                    .category("TOOLS")
                    .pricePerDay(new BigDecimal("25.00"))
                    .securityDeposit(new BigDecimal("50.00"))
                    .location("Downtown")
                    .availabilityStatus("AVAILABLE")
                    .lender(lender)
                    .build();
            item.addImage(ItemImage.builder()
                    .imageUrl("https://images.unsplash.com/photo-1504148455328-c376907d081c")
                    .isPrimary(true)
                    .build());
            Item savedItem = itemRepository.save(item);

            if (bookingRepository.count() == 0) {
                Booking booking = Booking.builder()
                        .bookingReference("SS-763580")
                        .item(savedItem)
                        .renter(renter)
                        .startDate(LocalDate.now().plusDays(1))
                        .endDate(LocalDate.now().plusDays(3))
                        .rentalAmount(new BigDecimal("50.00"))
                        .depositAmount(new BigDecimal("50.00"))
                        .totalAmount(new BigDecimal("100.00"))
                        .status(BookingStatus.CONFIRMED)
                        .build();
                Booking savedBooking = bookingRepository.save(booking);

                Payment payment = Payment.builder()
                        .paymentReference("PAY-E2E-1001")
                        .transactionReference("TXN-E2E-MOCK-1001")
                        .booking(savedBooking)
                        .amount(new BigDecimal("100.00"))
                        .currency("INR")
                        .paymentMethod(PaymentMethod.MOCK_CARD)
                        .status(PaymentStatus.SUCCESS)
                        .build();
                paymentRepository.save(payment);

                Handover handover = Handover.builder()
                        .booking(savedBooking)
                        .handoverToken("SS-HO-26ac1e05-2e2b-4bb4-88ac-707df17d19ef")
                        .status(HandoverStatus.PENDING)
                        .generatedAt(LocalDateTime.now())
                        .build();
                handoverRepository.save(handover);
            }
        }
        log.info("E2E seed data ready!");
    }
}
