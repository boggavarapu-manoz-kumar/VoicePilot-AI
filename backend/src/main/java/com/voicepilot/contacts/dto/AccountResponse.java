package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.AccountStatus;
import java.time.Instant;

/**
 * Detailed representation of a CRM Account returned by API operations.
 */
public record AccountResponse(
        Long id,
        String name,
        String domain,
        String industry,
        String phone,
        String website,
        AccountStatus status,
        long contactCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountResponse from(Account account, long contactCount) {
        return new AccountResponse(
                account.getId(),
                account.getName(),
                account.getDomain(),
                account.getIndustry(),
                account.getPhone(),
                account.getWebsite(),
                account.getStatus(),
                contactCount,
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }

    public static AccountResponse from(Account account) {
        return from(account, 0);
    }
}

