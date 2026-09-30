package com.sharespare.controller;

import com.sharespare.dto.request.VerifyHandoverRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.HandoverResponseDto;
import com.sharespare.service.HandoverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/handovers")
@RequiredArgsConstructor
public class HandoverController {

    private final HandoverService handoverService;

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<HandoverResponseDto>> getOrCreateHandover(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId) {
        HandoverResponseDto response = handoverService.getOrCreateHandover(userDetails.getUsername(), bookingId);
        return ResponseEntity.ok(
                ApiResponse.success("Handover QR token retrieved successfully", response)
        );
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<HandoverResponseDto>> verifyHandover(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifyHandoverRequest request) {
        HandoverResponseDto response = handoverService.verifyHandover(userDetails.getUsername(), request);
        return ResponseEntity.ok(
                ApiResponse.success("Handover verified successfully. Booking is now ACTIVE!", response)
        );
    }

    @GetMapping("/status/{bookingId}")
    public ResponseEntity<ApiResponse<HandoverResponseDto>> getHandoverStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId) {
        HandoverResponseDto response = handoverService.getHandoverStatus(userDetails.getUsername(), bookingId);
        return ResponseEntity.ok(
                ApiResponse.success("Handover status retrieved", response)
        );
    }
}
