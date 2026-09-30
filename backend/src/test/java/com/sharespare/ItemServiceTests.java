package com.sharespare;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.request.UpdateItemRequest;
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
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class ItemServiceTests {

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserService userService;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    private UserDto ownerUser;
    private UserDto otherUser;

    @BeforeEach
    void setUp() {
        itemRepository.deleteAll();
        userRepository.deleteAll();

        ownerUser = userService.registerUser(RegisterRequest.builder()
                .name("Lender Alice")
                .email("alice@lender.com")
                .password("Password123!")
                .build());

        otherUser = userService.registerUser(RegisterRequest.builder()
                .name("Renter Bob")
                .email("bob@renter.com")
                .password("Password123!")
                .build());
    }

    @Test
    @DisplayName("Should successfully create item listing for lender")
    void testCreateItem() {
        CreateItemRequest request = CreateItemRequest.builder()
                .name("Canon EOS R6 Camera")
                .category("Electronics")
                .description("Professional full-frame mirrorless camera for rent")
                .pricePerDay(new BigDecimal("1200.00"))
                .securityDeposit(new BigDecimal("10000.00"))
                .location("Coimbatore, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1516035069371-29a1b244cc32"))
                .build();

        ItemDto created = itemService.createItem(ownerUser.getEmail(), request);

        assertNotNull(created.getId());
        assertEquals("Canon EOS R6 Camera", created.getName());
        assertEquals("Electronics", created.getCategory());
        assertEquals("AVAILABLE", created.getAvailabilityStatus());
        assertEquals(ownerUser.getId(), created.getLenderId());
        assertEquals(1, created.getImages().size());
    }

    @Test
    @DisplayName("Should reject update if user is not the item owner")
    void testUnauthorizedUpdate() {
        CreateItemRequest createReq = CreateItemRequest.builder()
                .name("DeWalt Drill")
                .category("Tools")
                .description("Heavy duty power drill")
                .pricePerDay(new BigDecimal("300.00"))
                .securityDeposit(new BigDecimal("2000.00"))
                .location("Chennai, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1504148455328-c376907d081c"))
                .build();

        ItemDto item = itemService.createItem(ownerUser.getEmail(), createReq);

        UpdateItemRequest updateReq = UpdateItemRequest.builder()
                .name("Hacked Name")
                .category("Tools")
                .description("Attempted unauthorized modification")
                .pricePerDay(new BigDecimal("50.00"))
                .securityDeposit(new BigDecimal("100.00"))
                .location("Chennai, TN")
                .availabilityStatus("AVAILABLE")
                .build();

        assertThrows(BadRequestException.class, () ->
                itemService.updateItem(otherUser.getEmail(), item.getId(), updateReq)
        );
    }

    @Test
    @DisplayName("Should allow item owner to update listing details")
    void testAuthorizedUpdate() {
        CreateItemRequest createReq = CreateItemRequest.builder()
                .name("Sony PS5 Console")
                .category("Gaming")
                .description("4K gaming console with 2 dualsense controllers")
                .pricePerDay(new BigDecimal("700.00"))
                .securityDeposit(new BigDecimal("8000.00"))
                .location("Bangalore, KA")
                .imageUrls(List.of("https://images.unsplash.com/photo-1606813907291-d86efa9b94db"))
                .build();

        ItemDto item = itemService.createItem(ownerUser.getEmail(), createReq);

        UpdateItemRequest updateReq = UpdateItemRequest.builder()
                .name("Sony PS5 Slim Console + God of War")
                .category("Gaming")
                .description("Updated description with game bundle")
                .pricePerDay(new BigDecimal("800.00"))
                .securityDeposit(new BigDecimal("8500.00"))
                .location("Bangalore, KA")
                .availabilityStatus("AVAILABLE")
                .imageUrls(List.of("https://images.unsplash.com/photo-1606813907291-d86efa9b94db"))
                .build();

        ItemDto updated = itemService.updateItem(ownerUser.getEmail(), item.getId(), updateReq);

        assertEquals("Sony PS5 Slim Console + God of War", updated.getName());
        assertEquals(new BigDecimal("800.00"), updated.getPricePerDay());
    }

    @Test
    @DisplayName("Should fetch items listed by specific lender")
    void testGetItemsByLender() {
        CreateItemRequest item1 = CreateItemRequest.builder()
                .name("Item 1")
                .category("Tools")
                .description("Description 1 for item")
                .pricePerDay(new BigDecimal("100.00"))
                .securityDeposit(new BigDecimal("500.00"))
                .location("Loc 1")
                .imageUrls(List.of("https://example.com/img1.jpg"))
                .build();

        CreateItemRequest item2 = CreateItemRequest.builder()
                .name("Item 2")
                .category("Gaming")
                .description("Description 2 for item")
                .pricePerDay(new BigDecimal("200.00"))
                .securityDeposit(new BigDecimal("1000.00"))
                .location("Loc 2")
                .imageUrls(List.of("https://example.com/img2.jpg"))
                .build();

        itemService.createItem(ownerUser.getEmail(), item1);
        itemService.createItem(ownerUser.getEmail(), item2);

        List<ItemDto> aliceItems = itemService.getItemsByLender(ownerUser.getEmail());
        assertEquals(2, aliceItems.size());

        List<ItemDto> bobItems = itemService.getItemsByLender(otherUser.getEmail());
        assertEquals(0, bobItems.size());
    }
}
