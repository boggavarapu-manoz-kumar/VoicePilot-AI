-- ============================================================================
-- V2__init_crm_schema.sql
-- VoicePilot AI - Initial CRM Foundation Schema (Accounts & Contacts)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: crm_accounts
-- Description: Organizations, companies, or business entities in the CRM.
-- ----------------------------------------------------------------------------
CREATE TABLE crm_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(160) NOT NULL,
    domain VARCHAR(128) NULL,
    industry VARCHAR(80) NULL,
    phone VARCHAR(32) NULL,
    website VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_crm_accounts PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_crm_accounts_name ON crm_accounts (name);
CREATE INDEX idx_crm_accounts_domain ON crm_accounts (domain);
CREATE INDEX idx_crm_accounts_status ON crm_accounts (status);

-- ----------------------------------------------------------------------------
-- Table: crm_contacts
-- Description: Individual people / business contacts. Can exist independently
--              or be associated with an account.
-- ----------------------------------------------------------------------------
CREATE TABLE crm_contacts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    account_id BIGINT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    email VARCHAR(160) NOT NULL,
    phone VARCHAR(32) NULL,
    job_title VARCHAR(100) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'LEAD',
    notes TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_crm_contacts PRIMARY KEY (id),
    CONSTRAINT fk_crm_contacts_account FOREIGN KEY (account_id)
        REFERENCES crm_accounts (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_crm_contacts_email ON crm_contacts (email);
CREATE INDEX idx_crm_contacts_account_id ON crm_contacts (account_id);
CREATE INDEX idx_crm_contacts_status ON crm_contacts (status);
CREATE INDEX idx_crm_contacts_names ON crm_contacts (last_name, first_name);

