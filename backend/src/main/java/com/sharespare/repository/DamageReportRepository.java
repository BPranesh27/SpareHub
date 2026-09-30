package com.sharespare.repository;

import com.sharespare.entity.DamageReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DamageReportRepository extends JpaRepository<DamageReport, Long> {

    Optional<DamageReport> findByBookingId(Long bookingId);

    boolean existsByBookingId(Long bookingId);
}
