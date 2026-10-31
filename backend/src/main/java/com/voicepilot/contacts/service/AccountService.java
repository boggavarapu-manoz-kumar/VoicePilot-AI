package com.voicepilot.contacts.service;

import com.voicepilot.common.api.PageResponse;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.contacts.dto.AccountResponse;
import com.voicepilot.contacts.dto.CreateAccountRequest;
import com.voicepilot.contacts.dto.UpdateAccountRequest;
import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.AccountStatus;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.AccountSpecifications;
import com.voicepilot.contacts.repository.ContactRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Domain application service for managing CRM Accounts.
 * Handles lifecycle operations, status transitions, and data integrity boundaries.
 */
@Service
@Transactional(readOnly = true)
public class AccountService {

    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;

    public AccountService(AccountRepository accountRepository, ContactRepository contactRepository) {
        this.accountRepository = Objects.requireNonNull(accountRepository, "accountRepository must not be null");
        this.contactRepository = Objects.requireNonNull(contactRepository, "contactRepository must not be null");
    }

    /**
     * Creates a new Account entity.
     */
    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        Objects.requireNonNull(request, "create request must not be null");

        AccountStatus status = request.status() != null ? request.status() : AccountStatus.ACTIVE;
        Account account = new Account(
                trimToNull(request.name()),
                trimToNull(request.domain()),
                trimToNull(request.industry()),
                trimToNull(request.phone()),
                trimToNull(request.website()),
                status
        );

        Account saved = accountRepository.save(account);
        return AccountResponse.from(saved, 0);
    }

    /**
     * Retrieves an Account by ID or throws ResourceNotFoundException.
     */
    public AccountResponse getAccountById(Long id) {
        Account account = findAccountEntityById(id);
        long contactCount = contactRepository.countByAccountId(account.getId());
        return AccountResponse.from(account, contactCount);
    }

    /**
     * Lists accounts using composable specifications and pagination.
     */
    public PageResponse<AccountResponse> listAccounts(String searchTerm, AccountStatus status, Pageable pageable) {
        Specification<Account> spec = Specification.where(AccountSpecifications.withSearchTerm(searchTerm))
                .and(AccountSpecifications.withStatus(status));

        Page<Account> page = accountRepository.findAll(spec, pageable);
        return PageResponse.from(page, account -> {
            long count = contactRepository.countByAccountId(account.getId());
            return AccountResponse.from(account, count);
        });
    }

    /**
     * Updates an existing Account entity.
     */
    @Transactional
    public AccountResponse updateAccount(Long id, UpdateAccountRequest request) {
        Objects.requireNonNull(request, "update request must not be null");
        Account account = findAccountEntityById(id);

        account.setName(trimToNull(request.name()));
        account.setDomain(trimToNull(request.domain()));
        account.setIndustry(trimToNull(request.industry()));
        account.setPhone(trimToNull(request.phone()));
        account.setWebsite(trimToNull(request.website()));
        account.setStatus(request.status());

        Account updated = accountRepository.save(account);
        long contactCount = contactRepository.countByAccountId(updated.getId());
        return AccountResponse.from(updated, contactCount);
    }

    /**
     * Internal lookup helper for domain entity references.
     */
    public Account findAccountEntityById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Account ID must not be null");
        }
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account", id));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

