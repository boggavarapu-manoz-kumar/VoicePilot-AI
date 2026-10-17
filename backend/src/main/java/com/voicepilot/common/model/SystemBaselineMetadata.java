package com.voicepilot.common.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Entity representing the system baseline metadata established in V1 Flyway migration.
 * Allows Hibernate to perform schema validation (ddl-auto: validate) against Flyway DDL.
 */
@Entity
@Table(name = "sys_baseline_metadata")
public class SystemBaselineMetadata {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    private String id;

    @Column(name = "system_name", length = 128, nullable = false)
    private String systemName;

    @Column(name = "schema_version", length = 32, nullable = false)
    private String schemaVersion;

    @Column(name = "installed_at", nullable = false, updatable = false)
    private Instant installedAt;

    @Column(name = "status", length = 32, nullable = false)
    private String status;

    public SystemBaselineMetadata() {
    }

    public SystemBaselineMetadata(String id, String systemName, String schemaVersion, String status) {
        this.id = id;
        this.systemName = systemName;
        this.schemaVersion = schemaVersion;
        this.installedAt = Instant.now();
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSystemName() {
        return systemName;
    }

    public void setSystemName(String systemName) {
        this.systemName = systemName;
    }

    public String getSchemaVersion() {
        return schemaVersion;
    }

    public void setSchemaVersion(String schemaVersion) {
        this.schemaVersion = schemaVersion;
    }

    public Instant getInstalledAt() {
        return installedAt;
    }

    public void setInstalledAt(Instant installedAt) {
        this.installedAt = installedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
