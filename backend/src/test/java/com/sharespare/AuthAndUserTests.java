package com.sharespare;

import com.sharespare.dto.request.LoginRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.request.UpdateProfileRequest;
import com.sharespare.dto.response.JwtAuthResponse;
import com.sharespare.dto.response.UserDto;
import com.sharespare.entity.User;
import com.sharespare.exception.BadRequestException;
import com.sharespare.repository.UserRepository;
import com.sharespare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class AuthAndUserTests {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully register a new user with BCrypt hashed password")
    void testSuccessfulRegistration() {
        RegisterRequest request = RegisterRequest.builder()
                .name("Alex Lender")
                .email("alex@example.com")
                .password("SecurePass123!")
                .phone("+19876543210")
                .build();

        UserDto response = userService.registerUser(request);

        assertNotNull(response.getId());
        assertEquals("Alex Lender", response.getName());
        assertEquals("alex@example.com", response.getEmail());

        User dbUser = userRepository.findByEmail("alex@example.com").orElseThrow();
        assertTrue(passwordEncoder.matches("SecurePass123!", dbUser.getPassword()), "Password should be BCrypt hashed");
    }

    @Test
    @DisplayName("Should throw BadRequestException on duplicate email registration")
    void testDuplicateEmailRegistration() {
        RegisterRequest request1 = RegisterRequest.builder()
                .name("First User")
                .email("duplicate@example.com")
                .password("Password123")
                .build();
        userService.registerUser(request1);

        RegisterRequest request2 = RegisterRequest.builder()
                .name("Second User")
                .email("duplicate@example.com")
                .password("Password456")
                .build();

        assertThrows(BadRequestException.class, () -> userService.registerUser(request2));
    }

    @Test
    @DisplayName("Should authenticate user and return valid JWT token")
    void testSuccessfulLogin() {
        RegisterRequest register = RegisterRequest.builder()
                .name("Jane Renter")
                .email("jane@example.com")
                .password("RenterPass123")
                .build();
        userService.registerUser(register);

        LoginRequest login = LoginRequest.builder()
                .email("jane@example.com")
                .password("RenterPass123")
                .build();

        JwtAuthResponse authResponse = userService.authenticateUser(login);

        assertNotNull(authResponse.getAccessToken());
        assertEquals("Bearer", authResponse.getTokenType());
        assertEquals("Jane Renter", authResponse.getUser().getName());
    }

    @Test
    @DisplayName("Should retrieve and update user profile")
    void testProfileManagement() {
        RegisterRequest register = RegisterRequest.builder()
                .name("John Doe")
                .email("john@example.com")
                .password("Password123")
                .build();
        userService.registerUser(register);

        UserDto initialProfile = userService.getCurrentUserProfile("john@example.com");
        assertEquals("John Doe", initialProfile.getName());

        UpdateProfileRequest updateRequest = UpdateProfileRequest.builder()
                .name("John Updated")
                .phone("+919999999999")
                .build();

        UserDto updatedProfile = userService.updateUserProfile("john@example.com", updateRequest);
        assertEquals("John Updated", updatedProfile.getName());
        assertEquals("+919999999999", updatedProfile.getPhone());
    }
}
