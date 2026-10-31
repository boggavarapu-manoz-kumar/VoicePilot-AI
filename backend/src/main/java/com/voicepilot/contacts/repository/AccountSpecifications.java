package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.AccountStatus;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composable Spring Data JPA Specifications for Account queries.
 */
public final class AccountSpecifications {

    private AccountSpecifications() {
    }

    public static Specification<Account> withStatus(AccountStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Account> withSearchTerm(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.isBlank()) {
                return null;
            }
            String pattern = "%" + searchTerm.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("domain")), pattern),
                    cb.like(cb.lower(root.get("industry")), pattern)
            );
        };
    }

    public static Specification<Account> withDomain(String domain) {
        return (root, query, cb) -> domain == null || domain.isBlank()
                ? null
                : cb.equal(cb.lower(root.get("domain")), domain.trim().toLowerCase());
    }
}

