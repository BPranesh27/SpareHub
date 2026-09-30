package com.sharespare.controller;

import com.sharespare.dto.request.CreateDamageReportRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.BookingDto;
import com.sharespare.dto.response.DamageReportResponseDto;
import com.sharespare.dto.response.ReturnSummaryResponseDto;
import com.sharespare.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping("/{id}/return-request")
    public ResponseEntity<ApiResponse<BookingDto>> requestReturn(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        BookingDto response = returnService.requestReturn(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Return requested successfully! Booking status is now RETURN_REQUESTED.", response)
        );
    }

    @GetMapping("/{id}/damage-report")
    public ResponseEntity<ApiResponse<DamageReportResponseDto>> getDamageReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        DamageReportResponseDto response = returnService.getDamageReport(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Damage report retrieved successfully.", response)
        );
    }

    @PostMapping("/{id}/damage-report")
    public ResponseEntity<ApiResponse<DamageReportResponseDto>> submitDamageInspection(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CreateDamageReportRequest request) {
        DamageReportResponseDto response = returnService.submitDamageInspection(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(
                ApiResponse.success("Damage inspection submitted. Booking status is now RETURNED.", response)
        );
    }

    @PostMapping("/{id}/complete-return")
    public ResponseEntity<ApiResponse<BookingDto>> completeReturn(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        BookingDto response = returnService.completeReturn(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Return completed successfully! Deposit refund issued and booking is COMPLETED.", response)
        );
    }

    @GetMapping("/{id}/return-summary")
    public ResponseEntity<ApiResponse<ReturnSummaryResponseDto>> getReturnSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        ReturnSummaryResponseDto response = returnService.getReturnSummary(userDetails.getUsername(), id);
        return ResponseEntity.ok(
                ApiResponse.success("Return summary retrieved successfully.", response)
        );
    }
}
