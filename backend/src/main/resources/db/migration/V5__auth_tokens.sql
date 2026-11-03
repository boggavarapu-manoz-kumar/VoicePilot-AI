-- ============================================================================
-- V5__auth_tokens.sql
-- VoicePilot AI - Token Revocation, Rotation & Login Security
-- ============================================================================

-- Table: auth_refresh_tokens
CREATE TABLE auth_refresh_tokens (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    workspace_id BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    family_id VARCHAR(36) NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP NULL,
    CONSTRAINT pk_auth_refresh_tokens PRIMARY KEY (id),
    CONSTRAINT uq_auth_refresh_tokens_hash UNIQUE (token_hash),
    CONSTRAINT fk_auth_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES iam_users (id) ON DELETE CASCADE,
    CONSTRAINT fk_auth_refresh_tokens_workspace FOREIGN KEY (workspace_id)
        REFERENCES iam_workspaces (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_auth_refresh_family ON auth_refresh_tokens (family_id);
CREATE INDEX idx_auth_refresh_expires ON auth_refresh_tokens (expires_at);

-- Table: auth_token_blocklist
CREATE TABLE auth_token_blocklist (
    id BIGINT NOT NULL AUTO_INCREMENT,
    jti VARCHAR(36) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_auth_token_blocklist PRIMARY KEY (id),
    CONSTRAINT uq_auth_token_blocklist_jti UNIQUE (jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_auth_blocklist_expires ON auth_token_blocklist (expires_at);

-- Table: auth_login_attempts
CREATE TABLE auth_login_attempts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(160) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    succeeded BOOLEAN NOT NULL,
    attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_auth_login_attempts PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_auth_attempts_email ON auth_login_attempts (email, attempted_at);
CREATE INDEX idx_auth_attempts_ip ON auth_login_attempts (ip_address, attempted_at);
