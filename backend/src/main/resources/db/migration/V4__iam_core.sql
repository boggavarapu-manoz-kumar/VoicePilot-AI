-- ============================================================================
-- V4__iam_core.sql
-- VoicePilot AI - Identity, Workspaces & Memberships Foundation
-- ============================================================================

-- Table: iam_users
CREATE TABLE iam_users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    email VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_iam_users PRIMARY KEY (id),
    CONSTRAINT uq_iam_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_iam_users_active ON iam_users (is_active);

-- Table: iam_workspaces
CREATE TABLE iam_workspaces (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    plan VARCHAR(32) NOT NULL DEFAULT 'FREE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_iam_workspaces PRIMARY KEY (id),
    CONSTRAINT uq_iam_workspaces_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_iam_workspaces_active ON iam_workspaces (is_active);

-- Table: iam_workspace_members
CREATE TABLE iam_workspace_members (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(32) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_iam_workspace_members PRIMARY KEY (id),
    CONSTRAINT uq_iam_workspace_members_user UNIQUE (workspace_id, user_id),
    CONSTRAINT fk_iam_workspace_members_workspace FOREIGN KEY (workspace_id)
        REFERENCES iam_workspaces (id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_iam_workspace_members_user FOREIGN KEY (user_id)
        REFERENCES iam_users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_iam_workspace_members_user ON iam_workspace_members (user_id);
CREATE INDEX idx_iam_workspace_members_role ON iam_workspace_members (workspace_id, role);
