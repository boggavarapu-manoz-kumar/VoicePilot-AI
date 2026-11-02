package com.voicepilot.contacts.dto.importing;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Response payload returned by the import preview endpoint.
 */
public record ImportPreviewResponse(
        String sessionId,
        String fileName,
        int totalRows,
        int validRowCount,
        int invalidRowCount,
        int duplicateCount,
        List<String> detectedHeaders,
        Map<String, String> mappedFields,
        List<ParsedContactRow> sampleRows,
        List<ImportErrorDetail> validationErrors,
        Instant expiresAt
) {
}

