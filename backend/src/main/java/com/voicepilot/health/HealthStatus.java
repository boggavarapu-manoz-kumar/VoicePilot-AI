package com.voicepilot.health;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Detailed application health status payload.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record HealthStatus(
        String status,
        String version,
        String environment,
        Instant timestamp,
        Map<String, ComponentHealth> components
) {
    public record ComponentHealth(
            String status,
            String details
    ) {}
}
