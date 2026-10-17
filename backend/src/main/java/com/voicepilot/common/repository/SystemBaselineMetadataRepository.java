package com.voicepilot.common.repository;

import com.voicepilot.common.model.SystemBaselineMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for checking database connectivity and baseline metadata.
 */
@Repository
public interface SystemBaselineMetadataRepository extends JpaRepository<SystemBaselineMetadata, String> {
}
