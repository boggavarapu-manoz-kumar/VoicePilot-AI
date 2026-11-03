package com.voicepilot.iam.repository;

import com.voicepilot.iam.model.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    @Query("SELECT COUNT(a) FROM LoginAttempt a WHERE a.email = :email AND a.succeeded = false AND a.attemptedAt >= :since")
    long countFailedAttemptsByEmailSince(@Param("email") String email, @Param("since") Instant since);

    @Query("SELECT COUNT(a) FROM LoginAttempt a WHERE a.ipAddress = :ipAddress AND a.succeeded = false AND a.attemptedAt >= :since")
    long countFailedAttemptsByIpSince(@Param("ipAddress") String ipAddress, @Param("since") Instant since);
}

