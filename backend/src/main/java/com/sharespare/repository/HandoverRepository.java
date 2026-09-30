package com.sharespare.repository;

import com.sharespare.entity.Handover;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HandoverRepository extends JpaRepository<Handover, Long> {

    Optional<Handover> findByBookingId(Long bookingId);

    Optional<Handover> findByHandoverToken(String handoverToken);

    boolean existsByBookingId(Long bookingId);
}
