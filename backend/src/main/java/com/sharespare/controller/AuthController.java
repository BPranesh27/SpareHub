package com.sharespare.controller;

import com.sharespare.dto.request.LoginRequest;
import com.sharespare.dto.request.RegisterRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.JwtAuthResponse;
import com.sharespare.dto.response.UserDto;
import com.sharespare.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserDto>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        UserDto registeredUser = userService.registerUser(registerRequest);
        return new ResponseEntity<>(
                ApiResponse.success("User registered successfully!", registeredUser),
                HttpStatus.CREATED
        );
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> loginUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtAuthResponse authResponse = userService.authenticateUser(loginRequest);
        return ResponseEntity.ok(
                ApiResponse.success("Login successful!", authResponse)
        );
    }
}
