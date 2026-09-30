package com.sharespare.repository;

import com.sharespare.entity.Payment;
import com.sharespare.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentReference(String paymentReference);

    Optional<Payment> findByBookingId(Long bookingId);

    List<Payment> findByBookingRenterEmailOrderByIdDesc(String email);

    boolean existsByBookingIdAndStatus(Long bookingId, PaymentStatus status);
}
