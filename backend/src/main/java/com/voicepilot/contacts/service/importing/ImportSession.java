package com.voicepilot.contacts.service.importing;

import com.voicepilot.contacts.dto.importing.DuplicatePolicy;
import com.voicepilot.contacts.dto.importing.ParsedContactRow;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * In-memory representation of an active import session awaiting confirmation.
 */
public record ImportSession(
        String sessionId,
        String fileName,
        List<String> headers,
        Map<String, String> mappedFields,
        List<ParsedContactRow> parsedRows,
        Instant createdAt,
        Instant expiresAt,
        boolean executed
) {
    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public ImportSession withExecuted(boolean executed) {
        return new ImportSession(
                sessionId,
                fileName,
                headers,
                mappedFields,
                parsedRows,
                createdAt,
                expiresAt,
                executed
        );
    }
}

