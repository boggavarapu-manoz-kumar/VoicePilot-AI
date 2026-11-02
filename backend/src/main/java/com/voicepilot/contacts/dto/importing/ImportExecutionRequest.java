package com.voicepilot.contacts.dto.importing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for confirming and executing an import session.
 */
public record ImportExecutionRequest(
        @NotBlank(message = "Session ID is required")
        String sessionId,

        @NotNull(message = "Duplicate policy is required")
        DuplicatePolicy duplicatePolicy,

        boolean skipInvalidRows
) {
}

