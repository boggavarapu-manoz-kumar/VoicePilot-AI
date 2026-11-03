package com.voicepilot.iam.model;

import com.voicepilot.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Access token JTI blocklist table for revoked JWTs prior to their natural expiration.
 */
@Entity
@Table(name = "auth_token_blocklist")
public class TokenBlocklistEntry extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Column(name = "jti", length = 36, nullable = false, unique = true)
    private String jti;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    public TokenBlocklistEntry() {
    }

    public TokenBlocklistEntry(String jti, Instant expiresAt) {
        this.jti = jti;
        this.expiresAt = expiresAt;
    }

    public String getJti() {
        return jti;
    }

    public void setJti(String jti) {
        this.jti = jti;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}

