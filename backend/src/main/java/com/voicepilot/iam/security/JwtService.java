package com.voicepilot.iam.security;

import com.voicepilot.iam.model.WorkspaceRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Service for issuing and validating HS256 JWT access tokens and hashing refresh tokens.
 */
@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey signingKey;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        byte[] keyBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Issues a signed access token.
     */
    public String generateAccessToken(Long userId, String email, Long workspaceId, WorkspaceRole role, String jti) {
        Instant now = Instant.now();
        Instant expiry = now.plusSeconds(properties.getAccessTokenTtlSeconds());

        return Jwts.builder()
                .header().type("JWT").and()
                .issuer(properties.getIssuer())
                .subject(String.valueOf(userId))
                .id(jti != null ? jti : UUID.randomUUID().toString())
                .claim("email", email)
                .claim("workspaceId", workspaceId)
                .claim("role", role.name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Parses and cryptographically validates the JWT access token.
     */
    public Claims parseAndValidateClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .requireIssuer(properties.getIssuer())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Hashes an opaque token using SHA-256 for secure storage.
     */
    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public JwtProperties getProperties() {
        return properties;
    }
}

