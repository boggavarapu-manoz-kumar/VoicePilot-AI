-- ============================================================================
-- V3__crm_segments.sql
-- VoicePilot AI - CRM Contact Segments & Saved Views
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: crm_segments
-- Description: Saved search/filter configurations for reusable contact views.
--              Stores structured filter criteria in JSON format.
-- ----------------------------------------------------------------------------
CREATE TABLE crm_segments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255) NULL,
    filter_criteria TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_crm_segments PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_crm_segments_name ON crm_segments (name);

