package com.voicepilot.health;

import com.voicepilot.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Custom application health endpoint providing clear separation between
 * overall application status and component health (e.g. database).
 */
@RestController
@RequestMapping("/health")
@Tag(name = "Health", description = "Application runtime health and readiness telemetry")
public class AppHealthController {

    private final String appVersion;
    private final String environment;
    private final HealthEndpoint actuatorHealthEndpoint;

    public AppHealthController(
            @Value("${voicepilot.version:0.0.1-SNAPSHOT}") String appVersion,
            @Value("${spring.profiles.active:local}") String environment,
            @Autowired(required = false) HealthEndpoint actuatorHealthEndpoint
    ) {
        this.appVersion = appVersion;
        this.environment = environment;
        this.actuatorHealthEndpoint = actuatorHealthEndpoint;
    }

    @GetMapping
    @Operation(summary = "Get application health", description = "Returns application status, version, and component health.")
    public ResponseEntity<ApiResponse<HealthStatus>> getHealth() {
        Map<String, HealthStatus.ComponentHealth> componentMap = new LinkedHashMap<>();

        // Application runtime is active
        componentMap.put("application", new HealthStatus.ComponentHealth("UP", "Application runtime running cleanly"));

        // Actuator health check if available (e.g., DB health evaluated separately without masking app availability)
        if (actuatorHealthEndpoint != null) {
            HealthComponent health = actuatorHealthEndpoint.health();
            String overallStatus = health.getStatus().getCode();
            componentMap.put("actuator", new HealthStatus.ComponentHealth(overallStatus, "Spring Actuator health indicators"));
        } else {
            componentMap.put("database", new HealthStatus.ComponentHealth("DEFERRED", "Database health check deferred until connection established"));
        }

        HealthStatus healthStatus = new HealthStatus(
                "UP",
                appVersion,
                environment,
                Instant.now(),
                componentMap
        );

        return ResponseEntity.ok(ApiResponse.ok(healthStatus, "VoicePilot AI service is healthy"));
    }
}
