package com.voicepilot.contacts.dto.importing;

import java.time.Instant;
import java.util.List;

/**
 * Result report returned upon import completion or execution status check.
 */
public record ImportResultReport(
        String sessionId,
        int totalProcessed,
        int importedCount,
        int updatedCount,
        int skippedCount,
        int failedCount,
        long durationMs,
        List<Long> affectedContactIds,
        List<ImportErrorDetail> errorDetails,
        Instant completedAt
) {
}

