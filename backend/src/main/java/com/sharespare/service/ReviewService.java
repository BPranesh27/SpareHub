package com.sharespare.service;

import com.sharespare.dto.request.CreateReviewRequest;
import com.sharespare.dto.response.ItemRatingSummaryDto;
import com.sharespare.dto.response.ReviewResponseDto;

import java.util.List;

public interface ReviewService {

    ReviewResponseDto createReview(CreateReviewRequest request, String reviewerEmail);

    List<ReviewResponseDto> getReviewsByBooking(Long bookingId);

    List<ReviewResponseDto> getReviewsByItem(Long itemId);

    List<ReviewResponseDto> getReviewsByUser(Long userId);

    ItemRatingSummaryDto getItemRatingSummary(Long itemId);

    boolean hasUserReviewedBooking(Long bookingId, String userEmail);
}
