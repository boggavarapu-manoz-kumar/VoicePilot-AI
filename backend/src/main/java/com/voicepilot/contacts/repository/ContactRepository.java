package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for CRM Contact entities.
 * Supports pagination, specifications, email lookup, phone search, name search,
 * status filtering, and account filtering with N+1 fetch prevention via EntityGraph.
 */
@Repository
public interface ContactRepository extends JpaRepository<Contact, Long>, JpaSpecificationExecutor<Contact> {

    @Override
    @EntityGraph(attributePaths = {"account"})
    Optional<Contact> findById(Long id);

    @Override
    @EntityGraph(attributePaths = {"account"})
    Page<Contact> findAll(Specification<Contact> spec, Pageable pageable);

    Optional<Contact> findByEmailIgnoreCase(String email);

    List<Contact> findByPhone(String phone);

    @EntityGraph(attributePaths = {"account"})
    Page<Contact> findByStatus(ContactStatus status, Pageable pageable);

    @Query("SELECT c FROM Contact c LEFT JOIN FETCH c.account WHERE c.account.id = :accountId")
    Page<Contact> findByAccountId(@Param("accountId") Long accountId, Pageable pageable);

    @EntityGraph(attributePaths = {"account"})
    Page<Contact> findByAccount_Id(Long accountId, Pageable pageable);

    @EntityGraph(attributePaths = {"account"})
    Page<Contact> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String firstName, String lastName, Pageable pageable);

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.account.id = :accountId")
    long countByAccountId(@Param("accountId") Long accountId);

    long countByAccount_Id(Long accountId);
}
