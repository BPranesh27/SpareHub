package com.sharespare;

import com.sharespare.dto.request.CreateItemRequest;
import com.sharespare.dto.request.LoginRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.request.UpdateItemRequest;
import com.sharespare.dto.request.UpdateProfileRequest;
import com.sharespare.dto.response.ItemDto;
import com.sharespare.dto.response.JwtAuthResponse;
import com.sharespare.dto.response.UserDto;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.ItemRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.security.JwtUtils;
import com.sharespare.service.ItemService;
import com.sharespare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class Phase1And2VerificationTests {

    @Autowired
    private UserService userService;

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private UserDto userA;
    private UserDto userB;

    @BeforeEach
    void setUp() {
        itemRepository.deleteAll();
        userRepository.deleteAll();

        userA = userService.registerUser(RegisterRequest.builder()
                .name("Alice Owner")
                .email("alice@sharespare.com")
                .password("Password123!")
                .phone("+919876543210")
                .build());

        userB = userService.registerUser(RegisterRequest.builder()
                .name("Bob Intruder")
                .email("bob@sharespare.com")
                .password("Password456!")
                .phone("+919876543211")
                .build());
    }

    @Test
    @DisplayName("Phase 1 Verification: Authentication & JWT Token Validation")
    void verifyPhase1AuthenticationFlow() {
        // 1. Duplicate email prevention
        RegisterRequest duplicateReq = RegisterRequest.builder()
                .name("Alice Fake")
                .email("alice@sharespare.com")
                .password("Pass123!")
                .build();
        assertThrows(BadRequestException.class, () -> userService.registerUser(duplicateReq));

        // 2. Successful Login & Token Validation
        JwtAuthResponse authResp = userService.authenticateUser(LoginRequest.builder()
                .email("alice@sharespare.com")
                .password("Password123!")
                .build());
        assertNotNull(authResp.getAccessToken());
        assertTrue(jwtUtils.validateJwtToken(authResp.getAccessToken()));
        assertEquals("alice@sharespare.com", jwtUtils.getEmailFromJwtToken(authResp.getAccessToken()));

        // 3. Profile Fetch & Update
        UserDto profile = userService.getCurrentUserProfile("alice@sharespare.com");
        assertEquals("Alice Owner", profile.getName());

        UserDto updatedProfile = userService.updateUserProfile("alice@sharespare.com", UpdateProfileRequest.builder()
                .name("Alice Updated")
                .phone("+919999988888")
                .build());
        assertEquals("Alice Updated", updatedProfile.getName());
    }

    @Test
    @DisplayName("Phase 2 Verification: Item CRUD & Lender Ownership Guardrails")
    void verifyPhase2ItemCrudAndOwnership() {
        // 1. Create item by User A
        CreateItemRequest createItemReq = CreateItemRequest.builder()
                .name("Sony A7IV Camera Kit")
                .category("Electronics")
                .description("Professional full frame camera with 24-70mm lens")
                .pricePerDay(new BigDecimal("1500.00"))
                .securityDeposit(new BigDecimal("15000.00"))
                .location("Coimbatore, TN")
                .imageUrls(List.of("https://images.unsplash.com/photo-1516035069371-29a1b244cc32"))
                .build();

        ItemDto item = itemService.createItem(userA.getEmail(), createItemReq);
        assertNotNull(item.getId());
        assertEquals("Sony A7IV Camera Kit", item.getName());
        assertEquals(userA.getId(), item.getLenderId());

        // 2. Public Read
        ItemDto fetchedItem = itemService.getItemById(item.getId());
        assertEquals(item.getName(), fetchedItem.getName());

        // 3. Paginated Search
        Page<ItemDto> page = itemService.getAllItems("Electronics", null, "Sony", PageRequest.of(0, 10));
        assertEquals(1, page.getTotalElements());

        // 4. My Items filtering
        List<ItemDto> aliceItems = itemService.getItemsByLender(userA.getEmail());
        assertEquals(1, aliceItems.size());

        List<ItemDto> bobItems = itemService.getItemsByLender(userB.getEmail());
        assertEquals(0, bobItems.size());

        // 5. Ownership Guardrail: User B attempts to UPDATE User A's item -> Must throw BadRequestException
        UpdateItemRequest maliciousUpdate = UpdateItemRequest.builder()
                .name("Hacked Camera Name")
                .category("Electronics")
                .description("Hacked description")
                .pricePerDay(new BigDecimal("1.00"))
                .securityDeposit(new BigDecimal("0.00"))
                .location("Coimbatore, TN")
                .availabilityStatus("DEACTIVATED")
                .build();

        assertThrows(BadRequestException.class, () ->
                itemService.updateItem(userB.getEmail(), item.getId(), maliciousUpdate)
        );

        // 6. Ownership Guardrail: User B attempts to DELETE User A's item -> Must throw BadRequestException
        assertThrows(BadRequestException.class, () ->
                itemService.deleteItem(userB.getEmail(), item.getId())
        );

        // 7. Legitimate Owner Update
        UpdateItemRequest ownerUpdate = UpdateItemRequest.builder()
                .name("Sony A7IV Camera Kit + Extra Battery")
                .category("Electronics")
                .description("Professional full frame camera with 24-70mm lens and 2 batteries")
                .pricePerDay(new BigDecimal("1600.00"))
                .securityDeposit(new BigDecimal("15000.00"))
                .location("Coimbatore, TN")
                .availabilityStatus("AVAILABLE")
                .build();

        ItemDto updatedItem = itemService.updateItem(userA.getEmail(), item.getId(), ownerUpdate);
        assertEquals("Sony A7IV Camera Kit + Extra Battery", updatedItem.getName());
        assertEquals(new BigDecimal("1600.00"), updatedItem.getPricePerDay());

        // 8. Legitimate Owner Delete
        itemService.deleteItem(userA.getEmail(), item.getId());
        assertThrows(ResourceNotFoundException.class, () -> itemService.getItemById(item.getId()));
    }
}
