package com.voicepilot.iam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Tracks login attempts per email and IP for brute-force tracking and lockouts.
 */
@Entity
@Table(name = "auth_login_attempts")
public class LoginAttempt implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "email", length = 160, nullable = false)
    private String email;

    @Column(name = "ip_address", length = 45, nullable = false)
    private String ipAddress;

    @Column(name = "succeeded", nullable = false)
    private boolean succeeded;

    @Column(name = "attempted_at", nullable = false)
    private Instant attemptedAt;

    public LoginAttempt() {
    }

    public LoginAttempt(String email, String ipAddress, boolean succeeded) {
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.ipAddress = ipAddress;
        this.succeeded = succeeded;
        this.attemptedAt = Instant.now();
    }

    @PrePersist
    protected void onPrePersist() {
        if (this.attemptedAt == null) {
            this.attemptedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public boolean isSucceeded() {
        return succeeded;
    }

    public void setSucceeded(boolean succeeded) {
        this.succeeded = succeeded;
    }

    public Instant getAttemptedAt() {
        return attemptedAt;
    }

    public void setAttemptedAt(Instant attemptedAt) {
        this.attemptedAt = attemptedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LoginAttempt that = (LoginAttempt) o;
        return id != null && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
