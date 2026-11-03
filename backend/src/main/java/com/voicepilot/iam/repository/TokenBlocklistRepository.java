package com.voicepilot.iam.repository;

import com.voicepilot.iam.model.TokenBlocklistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface TokenBlocklistRepository extends JpaRepository<TokenBlocklistEntry, Long> {

    boolean existsByJti(String jti);

    @Modifying
    @Query("DELETE FROM TokenBlocklistEntry b WHERE b.expiresAt < :now")
    int deleteAllExpiredSince(@Param("now") Instant now);
}

