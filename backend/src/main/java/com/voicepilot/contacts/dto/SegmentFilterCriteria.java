package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.ContactStatus;

/**
 * Structured, validated filter criteria for a saved Contact Segment.
 * <p>
 * All fields are optional; null means "no filter on this dimension".
 * This record is serialized to JSON and stored in the {@code filter_criteria} column.
 * It must never contain raw SQL, JPQL, or arbitrary expressions — only typed field values
 * that map 1-to-1 to {@link com.voicepilot.contacts.repository.ContactSpecifications}.
 * </p>
 *
 * <ul>
 *   <li>{@code search}         — Free-text search across firstName, lastName, email, phone.</li>
 *   <li>{@code status}         — Exact match on {@link ContactStatus}.</li>
 *   <li>{@code accountId}      — Filter contacts belonging to the given account.</li>
 *   <li>{@code withoutAccount} — When {@code true}, filter contacts with no account assigned.</li>
 * </ul>
 *
 * {@code withoutAccount} takes precedence over {@code accountId} when both are supplied.
 */
public record SegmentFilterCriteria(
        String search,
        ContactStatus status,
        Long accountId,
        Boolean withoutAccount
) {
    /**
     * Returns an empty (no-filter) criteria instance — matches all contacts.
     */
    public static SegmentFilterCriteria empty() {
        return new SegmentFilterCriteria(null, null, null, null);
    }
}

