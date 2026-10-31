package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.AccountStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for CRM Account entities.
 * Supports pagination, specifications, name search, domain lookup, and status filtering.
 */
@Repository
public interface AccountRepository extends JpaRepository<Account, Long>, JpaSpecificationExecutor<Account> {

    Optional<Account> findByName(String name);

    Page<Account> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Account> findByDomainIgnoreCase(String domain);

    Page<Account> findByStatus(AccountStatus status, Pageable pageable);
}

