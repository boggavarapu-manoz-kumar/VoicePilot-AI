package com.voicepilot.contacts.dto.importing;

/**
 * Details of an individual row validation or parsing error.
 */
public record ImportErrorDetail(
        int rowNumber,
        String field,
        String rawValue,
        String issue
) {
}

