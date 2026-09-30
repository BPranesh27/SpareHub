package com.sharespare.repository;

import com.sharespare.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByBookingIdAndReviewerId(Long bookingId, Long reviewerId);

    List<Review> findByItemIdOrderByCreatedAtDesc(Long itemId);

    List<Review> findByBookingId(Long bookingId);

    List<Review> findByReviewerId(Long reviewerId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.item.id = :itemId")
    Double findAverageRatingByItemId(@Param("itemId") Long itemId);

    long countByItemId(Long itemId);
}
