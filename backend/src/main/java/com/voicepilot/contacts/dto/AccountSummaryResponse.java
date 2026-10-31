package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.Account;

/**
 * Lightweight account summary projection for embedded representation in Contact responses.
 */
public record AccountSummaryResponse(
        Long id,
        String name,
        String domain
) {
    public static AccountSummaryResponse from(Account account) {
        if (account == null) {
            return null;
        }
        return new AccountSummaryResponse(
                account.getId(),
                account.getName(),
                account.getDomain()
        );
    }
}

