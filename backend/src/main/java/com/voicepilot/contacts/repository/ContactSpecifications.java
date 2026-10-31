package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import org.springframework.data.jpa.domain.Specification;

/**
 * Composable Spring Data JPA Specifications for Contact queries.
 */
public final class ContactSpecifications {

    private ContactSpecifications() {
    }

    public static Specification<Contact> withStatus(ContactStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Contact> withAccountId(Long accountId) {
        return (root, query, cb) -> accountId == null ? null : cb.equal(root.get("account").get("id"), accountId);
    }

    public static Specification<Contact> withoutAccount() {
        return (root, query, cb) -> cb.isNull(root.get("account"));
    }

    public static Specification<Contact> withSearchTerm(String searchTerm) {
        return (root, query, cb) -> {
            if (searchTerm == null || searchTerm.isBlank()) {
                return null;
            }
            String pattern = "%" + searchTerm.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern)
            );
        };
    }
}

