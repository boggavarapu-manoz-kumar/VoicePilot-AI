package com.voicepilot.contacts.service.importing;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Thread-safe in-memory cache holding pending import sessions with automatic expiration.
 */
@Component
public class ImportSessionRegistry {

    private final Map<String, ImportSession> sessions = new ConcurrentHashMap<>();
    private static final Duration DEFAULT_TTL = Duration.ofMinutes(15);

    public void register(ImportSession session) {
        sessions.put(session.sessionId(), session);
    }

    public Optional<ImportSession> get(String sessionId) {
        ImportSession session = sessions.get(sessionId);
        if (session == null) {
            return Optional.empty();
        }
        if (session.isExpired()) {
            sessions.remove(sessionId);
            return Optional.empty();
        }
        return Optional.of(session);
    }

    public void remove(String sessionId) {
        sessions.remove(sessionId);
    }

    public Duration getDefaultTtl() {
        return DEFAULT_TTL;
    }

    public int size() {
        return sessions.size();
    }

    /**
     * Periodic sweep every 5 minutes to evict expired sessions.
     */
    public void evictExpired() {
        Instant now = Instant.now();
        sessions.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }
}

