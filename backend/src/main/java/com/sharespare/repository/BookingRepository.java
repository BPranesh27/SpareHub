package com.sharespare.repository;

import com.sharespare.entity.Booking;
import com.sharespare.entity.BookingStatus;
import com.sharespare.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    Optional<Booking> findByBookingReference(String bookingReference);

    List<Booking> findByRenterOrderByIdDesc(User renter);

    List<Booking> findByItemLenderOrderByIdDesc(User lender);

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.item.id = :itemId " +
           "AND b.status IN (com.sharespare.entity.BookingStatus.PENDING, com.sharespare.entity.BookingStatus.CONFIRMED, com.sharespare.entity.BookingStatus.ACTIVE, com.sharespare.entity.BookingStatus.RETURN_REQUESTED) " +
           "AND :newStart < b.endDate " +
           "AND :newEnd > b.startDate")
    long countConflictingBookings(
            @Param("itemId") Long itemId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd
    );

    @Query("SELECT COUNT(b) FROM Booking b " +
           "WHERE b.item.id = :itemId " +
           "AND b.id != :excludeBookingId " +
           "AND b.status IN (com.sharespare.entity.BookingStatus.PENDING, com.sharespare.entity.BookingStatus.CONFIRMED, com.sharespare.entity.BookingStatus.ACTIVE, com.sharespare.entity.BookingStatus.RETURN_REQUESTED) " +
           "AND :newStart < b.endDate " +
           "AND :newEnd > b.startDate")
    long countConflictingBookingsExcluding(
            @Param("itemId") Long itemId,
            @Param("excludeBookingId") Long excludeBookingId,
            @Param("newStart") LocalDate newStart,
            @Param("newEnd") LocalDate newEnd
    );
}
