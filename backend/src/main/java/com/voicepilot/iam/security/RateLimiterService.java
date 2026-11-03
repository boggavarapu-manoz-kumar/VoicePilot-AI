package com.voicepilot.iam.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token bucket rate limiter powered by Bucket4j.
 */
@Component
public class RateLimiterService {

    // Login rate limit: 10 requests per minute per IP
    private final Map<String, Bucket> loginIpBuckets = new ConcurrentHashMap<>();

    // General auth rate limit: 30 requests per minute per IP
    private final Map<String, Bucket> generalAuthIpBuckets = new ConcurrentHashMap<>();

    public boolean tryConsumeLogin(String ipAddress) {
        Bucket bucket = loginIpBuckets.computeIfAbsent(ipAddress, ip -> {
            Refill refill = Refill.intervally(10, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(10, refill);
            return Bucket.builder().addLimit(limit).build();
        });
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeGeneralAuth(String ipAddress) {
        Bucket bucket = generalAuthIpBuckets.computeIfAbsent(ipAddress, ip -> {
            Refill refill = Refill.intervally(30, Duration.ofMinutes(1));
            Bandwidth limit = Bandwidth.classic(30, refill);
            return Bucket.builder().addLimit(limit).build();
        });
        return bucket.tryConsume(1);
    }
}

