package com.voicepilot.contacts.dto.importing;

/**
 * Strategy applied when duplicate contacts are detected during import.
 */
public enum DuplicatePolicy {
    /**
     * Skip duplicate candidates and import all remaining valid contacts.
     */
    SKIP,

    /**
     * Abort the import and reject the entire batch if any duplicate candidate is detected.
     */
    REJECT_ALL,

    /**
     * Update existing contact record with new non-empty values from CSV.
     */
    UPDATE,

    /**
     * Allow inserting duplicate contact as a new record.
     */
    ALLOW_DUPLICATES
}

