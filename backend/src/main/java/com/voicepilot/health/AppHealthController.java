package com.voicepilot.health;

import com.voicepilot.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
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

    private static final Logger log = LoggerFactory.getLogger(AppHealthController.class);

    private final String appVersion;
    private final String environment;
    private final HealthEndpoint actuatorHealthEndpoint;
    private final DataSource dataSource;

    public AppHealthController(
            @Value("${voicepilot.version:0.0.1-SNAPSHOT}") String appVersion,
            @Value("${spring.profiles.active:local}") String environment,
            @Autowired(required = false) HealthEndpoint actuatorHealthEndpoint,
            @Autowired(required = false) DataSource dataSource
    ) {
        this.appVersion = appVersion;
        this.environment = environment;
        this.actuatorHealthEndpoint = actuatorHealthEndpoint;
        this.dataSource = dataSource;
    }

    @GetMapping
    @Operation(summary = "Get application health", description = "Returns application status, version, and component health.")
    public ResponseEntity<ApiResponse<HealthStatus>> getHealth() {
        Map<String, HealthStatus.ComponentHealth> componentMap = new LinkedHashMap<>();

        // 1. Application runtime is active
        componentMap.put("application", new HealthStatus.ComponentHealth("UP", "Application runtime running cleanly"));

        // 2. Database connectivity evaluated independently
        HealthStatus.ComponentHealth dbHealth = checkDatabaseHealth();
        componentMap.put("database", dbHealth);

        // 3. Actuator health indicators if available
        if (actuatorHealthEndpoint != null) {
            try {
                HealthComponent health = actuatorHealthEndpoint.health();
                String overallStatus = health.getStatus().getCode();
                componentMap.put("actuator", new HealthStatus.ComponentHealth(overallStatus, "Spring Actuator indicators"));
            } catch (Exception e) {
                componentMap.put("actuator", new HealthStatus.ComponentHealth("UNKNOWN", "Actuator inspection error: " + e.getMessage()));
            }
        }

        // Overall application status remains UP if runtime is healthy, reflecting independence from DB failures
        HealthStatus healthStatus = new HealthStatus(
                "UP",
                appVersion,
                environment,
                Instant.now(),
                componentMap
        );

        return ResponseEntity.ok(ApiResponse.ok(healthStatus, "VoicePilot AI service telemetry reported"));
    }

    private HealthStatus.ComponentHealth checkDatabaseHealth() {
        if (dataSource == null) {
            return new HealthStatus.ComponentHealth("DEFERRED", "No DataSource configured in the current context");
        }
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                String product = connection.getMetaData().getDatabaseProductName();
                String version = connection.getMetaData().getDatabaseProductVersion();
                return new HealthStatus.ComponentHealth("UP", "Connected to " + product + " (" + version + ")");
            } else {
                return new HealthStatus.ComponentHealth("DOWN", "Database connection validation check failed (timeout)");
            }
        } catch (Exception e) {
            log.warn("Database health check could not establish connection: {}", e.getMessage());
            return new HealthStatus.ComponentHealth("DOWN", "Database connection failed: " + e.getMessage());
        }
    }
}
