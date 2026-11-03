package com.voicepilot.iam.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for JWT issuance, validation, and cookie transport.
 */
@Component
@ConfigurationProperties(prefix = "voicepilot.security.jwt")
public class JwtProperties {

    /**
     * Secret key for HS256 HMAC signature. Must be at least 256 bits (32 bytes), recommended 512 bits.
     */
    private String secret = "v01c3p1l0t-s3cur3-jwt-d3v3l0pm3nt-s3cr3t-k3y-at-l3ast-512-b1ts-f0r-hs256-hashing-pr0t0c0l-sup3r-s3cur3";

    /**
     * Token issuer claim.
     */
    private String issuer = "voicepilot-api";

    /**
     * Access token lifetime in seconds (default: 15 minutes = 900s).
     */
    private long accessTokenTtlSeconds = 900L;

    /**
     * Refresh token lifetime in seconds (default: 30 days = 2592000s).
     */
    private long refreshTokenTtlSeconds = 2592000L;

    /**
     * Cookie name for refresh token.
     */
    private String refreshCookieName = "vp_rt";

    /**
     * Whether the refresh token cookie requires HTTPS (default: false for local development, true in prod).
     */
    private boolean cookieSecure = false;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public long getAccessTokenTtlSeconds() {
        return accessTokenTtlSeconds;
    }

    public void setAccessTokenTtlSeconds(long accessTokenTtlSeconds) {
        this.accessTokenTtlSeconds = accessTokenTtlSeconds;
    }

    public long getRefreshTokenTtlSeconds() {
        return refreshTokenTtlSeconds;
    }

    public void setRefreshTokenTtlSeconds(long refreshTokenTtlSeconds) {
        this.refreshTokenTtlSeconds = refreshTokenTtlSeconds;
    }

    public String getRefreshCookieName() {
        return refreshCookieName;
    }

    public void setRefreshCookieName(String refreshCookieName) {
        this.refreshCookieName = refreshCookieName;
    }

    public boolean isCookieSecure() {
        return cookieSecure;
    }

    public void setCookieSecure(boolean cookieSecure) {
        this.cookieSecure = cookieSecure;
    }
}

