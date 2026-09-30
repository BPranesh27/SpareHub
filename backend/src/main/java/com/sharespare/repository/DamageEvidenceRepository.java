package com.sharespare.repository;

import com.sharespare.entity.DamageEvidence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DamageEvidenceRepository extends JpaRepository<DamageEvidence, Long> {

    List<DamageEvidence> findByDamageReportId(Long damageReportId);
}
