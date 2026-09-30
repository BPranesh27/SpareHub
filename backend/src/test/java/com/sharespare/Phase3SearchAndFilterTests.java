package com.sharespare;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.response.ItemAvailabilityDto;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.UserDto;
import com.sharespare.exception.BadRequestException;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.ItemService;
import com.sharespare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class Phase3SearchAndFilterTests {

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserService userService;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    private UserDto lender;

    @BeforeEach
    void setUp() {
        itemRepository.deleteAll();
        userRepository.deleteAll();

        lender = userService.registerUser(RegisterRequest.builder()
                .name("Marketplace Lender")
                .email("lender@sharespare.com")
                .password("Password123!")
                .build());

        // Create initial sample dataset for search & pagination
        itemService.createItem(lender.getEmail(), CreateItemRequest.builder()
                .name("Sony FX3 Cinema Camera")
                .category("Electronics")
                .description("4K Full-Frame Cinema Line Camera")
                .pricePerDay(new BigDecimal("1500.00"))
                .securityDeposit(new BigDecimal("15000.00"))
                .location("Coimbatore, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1516035069371-29a1b244cc32"))
                .build());

        itemService.createItem(lender.getEmail(), CreateItemRequest.builder()
                .name("DeWalt Cordless Drill Combo")
                .category("Tools")
                .description("20V MAX Brushless Hammer Drill")
                .pricePerDay(new BigDecimal("400.00"))
                .securityDeposit(new BigDecimal("4000.00"))
                .location("Bangalore, KA")
                .imageUrls(List.of("https://images.unsplash.com/photo-1504148455328-c376907d081c"))
                .build());

        itemService.createItem(lender.getEmail(), CreateItemRequest.builder()
                .name("PlayStation 5 Console")
                .category("Gaming")
                .description("Next-gen gaming console with 2 controllers")
                .pricePerDay(new BigDecimal("750.00"))
                .securityDeposit(new BigDecimal("8000.00"))
                .location("Chennai, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1606813907291-d86efa9b94db"))
                .build());

        itemService.createItem(lender.getEmail(), CreateItemRequest.builder()
                .name("Canon EOS R5 Camera")
                .category("Electronics")
                .description("8K Video mirrorless camera")
                .pricePerDay(new BigDecimal("1800.00"))
                .securityDeposit(new BigDecimal("20000.00"))
                .location("Coimbatore, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1516035069371-29a1b244cc32"))
                .build());
    }

    @Test
    @DisplayName("Phase 3 Verification: Category Filter")
    void testCategoryFilter() {
        Page<ItemDto> electronics = itemService.getAllItems("Electronics", null, null, PageRequest.of(0, 10));
        assertEquals(2, electronics.getTotalElements());

        Page<ItemDto> tools = itemService.getAllItems("Tools", null, null, PageRequest.of(0, 10));
        assertEquals(1, tools.getTotalElements());
    }

    @Test
    @DisplayName("Phase 3 Verification: Search Keyword Query")
    void testSearchQuery() {
        Page<ItemDto> searchResult = itemService.getAllItems(null, null, "Camera", PageRequest.of(0, 10));
        assertEquals(2, searchResult.getTotalElements());
    }

    @Test
    @DisplayName("Phase 3 Verification: Location Filter")
    void testLocationFilter() {
        Page<ItemDto> locationResult = itemService.getAllItems(null, "Coimbatore", null, PageRequest.of(0, 10));
        assertEquals(2, locationResult.getTotalElements());
    }

    @Test
    @DisplayName("Phase 3 Verification: Combined Search + Category + Location Filter")
    void testCombinedFilter() {
        Page<ItemDto> result = itemService.getAllItems("Electronics", "Coimbatore", "Sony", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("Sony FX3 Cinema Camera", result.getContent().get(0).getName());
    }

    @Test
    @DisplayName("Phase 3 Verification: Pagination Navigation")
    void testPagination() {
        Page<ItemDto> page1 = itemService.getAllItems(null, null, null, PageRequest.of(0, 2, Sort.by("id").ascending()));
        assertEquals(2, page1.getContent().size());
        assertEquals(4, page1.getTotalElements());
        assertEquals(2, page1.getTotalPages());

        Page<ItemDto> page2 = itemService.getAllItems(null, null, null, PageRequest.of(1, 2, Sort.by("id").ascending()));
        assertEquals(2, page2.getContent().size());
        assertNotEquals(page1.getContent().get(0).getId(), page2.getContent().get(0).getId());
    }

    @Test
    @DisplayName("Phase 3 Verification: Availability & Date Range Calculations")
    void testAvailabilityCheck() {
        ItemDto item = itemService.getAllItems("Electronics", null, "Sony", PageRequest.of(0, 1)).getContent().get(0);

        LocalDate today = LocalDate.now();
        LocalDate startDate = today.plusDays(2);
        LocalDate endDate = today.plusDays(5); // 3 rental days

        ItemAvailabilityDto availability = itemService.checkAvailability(item.getId(), startDate, endDate);

        assertTrue(availability.isAvailable());
        assertEquals(3, availability.getRentalDays());
        assertEquals(new BigDecimal("4500.00"), availability.getRentalAmount()); // 3 * 1500
        assertEquals(new BigDecimal("15000.00"), availability.getDepositAmount());
        assertEquals(new BigDecimal("19500.00"), availability.getTotalAmount()); // 4500 + 15000

        // Validation Checks
        assertThrows(BadRequestException.class, () ->
                itemService.checkAvailability(item.getId(), today.minusDays(1), today.plusDays(2))
        );

        assertThrows(BadRequestException.class, () ->
                itemService.checkAvailability(item.getId(), today.plusDays(5), today.plusDays(2))
        );
    }
}
