package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import java.time.Instant;

/**
 * Detailed representation of a CRM Contact returned by API operations.
 */
public record ContactResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String jobTitle,
        ContactStatus status,
        String notes,
        AccountSummaryResponse account,
        Instant createdAt,
        Instant updatedAt
) {
    public static ContactResponse from(Contact contact) {
        AccountSummaryResponse accountSummary = contact.getAccount() != null
                ? AccountSummaryResponse.from(contact.getAccount())
                : null;
        return new ContactResponse(
                contact.getId(),
                contact.getFirstName(),
                contact.getLastName(),
                contact.getEmail(),
                contact.getPhone(),
                contact.getJobTitle(),
                contact.getStatus(),
                contact.getNotes(),
                accountSummary,
                contact.getCreatedAt(),
                contact.getUpdatedAt()
        );
    }
}

