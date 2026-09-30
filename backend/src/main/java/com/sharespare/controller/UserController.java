package com.sharespare.controller;

import com.sharespare.dto.request.UpdateProfileRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.UserDto;
import com.sharespare.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto userProfile = userService.getCurrentUserProfile(userDetails.getUsername());
        return ResponseEntity.ok(
                ApiResponse.success("Profile retrieved successfully", userProfile)
        );
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest updateProfileRequest) {
        UserDto updatedProfile = userService.updateUserProfile(userDetails.getUsername(), updateProfileRequest);
        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", updatedProfile)
        );
    }
}
