package com.sharespare.service.impl;

import com.sharespare.dto.request.CreateReviewRequest;
import com.sharespare.dto.response.ItemRatingSummaryDto;
import com.sharespare.dto.response.ReviewResponseDto;
import com.sharespare.entity.Booking;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.Review;
import com.sharespare.entity.User;
import com.sharespare.exception.BadRequestException;
import com.sharespare.exception.ResourceNotFoundException;
import com.sharespare.repository.BookingRepository;
import com.sharespare.repository.ReviewRepository;
import com.sharespare.repository.UserRepository;
import com.sharespare.entity.NotificationType;
import com.sharespare.service.NotificationService;
import com.sharespare.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ReviewResponseDto createReview(CreateReviewRequest request, String reviewerEmail) {
        if (reviewerEmail == null || reviewerEmail.isBlank()) {
            throw new BadRequestException("Unauthorized: Reviewer email must not be empty.");
        }

        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + reviewerEmail));

        if (request.getBookingId() == null) {
            throw new BadRequestException("Booking ID is required.");
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + request.getBookingId()));

        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Booking must be COMPLETED before submitting a review.");
        }

        Long renterId = booking.getRenter() != null ? booking.getRenter().getId() : null;
        Long lenderId = (booking.getItem() != null && booking.getItem().getLender() != null)
                ? booking.getItem().getLender().getId() : null;

        boolean isRenter = reviewer.getId().equals(renterId);
        boolean isLender = reviewer.getId().equals(lenderId);

        if (!isRenter && !isLender) {
            throw new BadRequestException("Unauthorized: Only participants of this booking can submit a review.");
        }

        if (request.getRating() == null || request.getRating() < 1 || request.getRating() > 5) {
            throw new BadRequestException("Rating must be between 1 and 5.");
        }

        if (reviewRepository.existsByBookingIdAndReviewerId(booking.getId(), reviewer.getId())) {
            throw new BadRequestException("Duplicate review: You have already submitted a review for this booking.");
        }

        String comment = request.getComment() != null ? request.getComment().trim() : null;
        if (comment != null && comment.length() > 1000) {
            throw new BadRequestException("Comment cannot exceed 1000 characters.");
        }

        Review review = Review.builder()
                .booking(booking)
                .reviewer(reviewer)
                .item(booking.getItem())
                .rating(request.getRating())
                .comment(comment)
                .build();

        Review saved = reviewRepository.save(review);

        try {
            // Notify item owner / counterpart
            User recipient = isRenter ? booking.getItem().getLender() : booking.getRenter();
            if (recipient != null) {
                notificationService.createNotification(
                        recipient,
                        NotificationType.REVIEW_RECEIVED,
                        "New Review Received",
                        reviewer.getName() + " left a " + request.getRating() + "-star review for " + booking.getItem().getName() + ".",
                        booking.getItem().getId(),
                        "ITEM"
                );
            }
        } catch (Exception e) {
            // Ignore notification failure
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByBooking(Long bookingId) {
        return reviewRepository.findByBookingId(bookingId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByItem(Long itemId) {
        return reviewRepository.findByItemIdOrderByCreatedAtDesc(itemId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponseDto> getReviewsByUser(Long userId) {
        return reviewRepository.findByReviewerId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ItemRatingSummaryDto getItemRatingSummary(Long itemId) {
        Double avg = reviewRepository.findAverageRatingByItemId(itemId);
        long count = reviewRepository.countByItemId(itemId);
        double roundedAvg = avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
        return ItemRatingSummaryDto.builder()
                .itemId(itemId)
                .averageRating(roundedAvg)
                .totalReviews(count)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUserReviewedBooking(Long bookingId, String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return false;
        }
        return userRepository.findByEmail(userEmail)
                .map(user -> reviewRepository.existsByBookingIdAndReviewerId(bookingId, user.getId()))
                .orElse(false);
    }

    private ReviewResponseDto mapToDto(Review review) {
        return ReviewResponseDto.builder()
                .id(review.getId())
                .bookingId(review.getBooking() != null ? review.getBooking().getId() : null)
                .reviewerId(review.getReviewer() != null ? review.getReviewer().getId() : null)
                .reviewerName(review.getReviewer() != null ? review.getReviewer().getName() : "Anonymous")
                .itemId(review.getItem() != null ? review.getItem().getId() : null)
                .itemName(review.getItem() != null ? review.getItem().getName() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
