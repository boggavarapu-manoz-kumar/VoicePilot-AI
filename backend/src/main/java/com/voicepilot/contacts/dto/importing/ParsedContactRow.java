package com.voicepilot.contacts.dto.importing;

import java.util.List;
import java.util.Map;

/**
 * Normalized data structure for an individual parsed row during preview and execution.
 */
public record ParsedContactRow(
        int rowNumber,
        String firstName,
        String lastName,
        String email,
        String phone,
        String jobTitle,
        String status,
        String notes,
        String accountIdentifier,
        boolean valid,
        boolean duplicate,
        Long matchedContactId,
        Long matchedAccountId,
        List<ImportErrorDetail> errors
) {
}

