-- ============================================================================
-- V1__init_system_baseline.sql
-- VoicePilot AI - Initial Database Foundation & Baseline Schema
-- ============================================================================

-- System metadata table to verify database connectivity, schema validation,
-- and migration baseline tracking across environments.
CREATE TABLE IF NOT EXISTS sys_baseline_metadata (
    id VARCHAR(64) NOT NULL,
    system_name VARCHAR(128) NOT NULL,
    schema_version VARCHAR(32) NOT NULL,
    installed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT pk_sys_baseline_metadata PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert the baseline system record if not already present
INSERT INTO sys_baseline_metadata (id, system_name, schema_version, status)
VALUES ('SYS-001', 'VoicePilot AI Voice CRM', '1.0.0', 'INITIALIZED')
ON DUPLICATE KEY UPDATE system_name = VALUES(system_name);
