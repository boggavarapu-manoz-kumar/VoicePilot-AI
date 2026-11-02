package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.Segment;

import java.time.Instant;

/**
 * API response model for a saved Contact Segment.
 * Exposes the deserialized filter criteria and a live count of matching contacts.
 */
public record SegmentResponse(
        Long id,
        String name,
        String description,
        SegmentFilterCriteria filterCriteria,
        long matchingContactCount,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Constructs a response from the entity with a pre-computed contact count.
     * The contact count must be evaluated at the service layer to avoid N+1 queries.
     */
    public static SegmentResponse from(Segment segment, SegmentFilterCriteria criteria, long contactCount) {
        return new SegmentResponse(
                segment.getId(),
                segment.getName(),
                segment.getDescription(),
                criteria,
                contactCount,
                segment.getCreatedAt(),
                segment.getUpdatedAt()
        );
    }
}

