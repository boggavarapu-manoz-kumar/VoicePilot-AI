package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Segment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for CRM Segment entities.
 * Supports lookup by name for duplicate-name enforcement.
 */
@Repository
public interface SegmentRepository extends JpaRepository<Segment, Long> {

    /**
     * Looks up a segment by its exact name (case-sensitive).
     * Used to enforce uniqueness at the service layer.
     */
    Optional<Segment> findByName(String name);
}

