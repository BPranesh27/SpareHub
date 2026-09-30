package com.sharespare.controller;

import com.sharespare.dto.request.CreateReviewRequest;
import com.sharespare.dto.response.ApiResponse;
import com.sharespare.dto.response.ItemRatingSummaryDto;
import com.sharespare.dto.response.ReviewResponseDto;
import com.sharespare.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewResponseDto>> createReview(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponseDto response = reviewService.createReview(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted successfully", response));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> getReviewsByBooking(
            @PathVariable Long bookingId) {
        List<ReviewResponseDto> reviews = reviewService.getReviewsByBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully", reviews));
    }

    @GetMapping("/booking/{bookingId}/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> getBookingReviewStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long bookingId) {
        boolean reviewed = reviewService.hasUserReviewedBooking(bookingId, userDetails != null ? userDetails.getUsername() : null);
        return ResponseEntity.ok(ApiResponse.success("Booking review status retrieved", Map.of("reviewed", reviewed)));
    }

    @GetMapping("/item/{itemId}")
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> getReviewsByItem(
            @PathVariable Long itemId) {
        List<ReviewResponseDto> reviews = reviewService.getReviewsByItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Item reviews retrieved successfully", reviews));
    }

    @GetMapping("/item/{itemId}/summary")
    public ResponseEntity<ApiResponse<ItemRatingSummaryDto>> getItemRatingSummary(
            @PathVariable Long itemId) {
        ItemRatingSummaryDto summary = reviewService.getItemRatingSummary(itemId);
        return ResponseEntity.ok(ApiResponse.success("Item rating summary retrieved successfully", summary));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<ReviewResponseDto>>> getReviewsByUser(
            @PathVariable Long userId) {
        List<ReviewResponseDto> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("User reviews retrieved successfully", reviews));
    }
}
