package com.voicepilot.contacts.service.importing;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Maps raw CSV header columns to standardized Contact entity properties.
 */
@Component
public class ContactColumnMapper {

    public static final String FIELD_FIRST_NAME = "firstName";
    public static final String FIELD_LAST_NAME = "lastName";
    public static final String FIELD_EMAIL = "email";
    public static final String FIELD_PHONE = "phone";
    public static final String FIELD_JOB_TITLE = "jobTitle";
    public static final String FIELD_STATUS = "status";
    public static final String FIELD_NOTES = "notes";
    public static final String FIELD_ACCOUNT = "account";

    private static final Map<String, String> ALIAS_MAP = new HashMap<>();

    static {
        // First name aliases
        registerAlias("first_name", FIELD_FIRST_NAME);
        registerAlias("firstname", FIELD_FIRST_NAME);
        registerAlias("first", FIELD_FIRST_NAME);
        registerAlias("given_name", FIELD_FIRST_NAME);
        registerAlias("fname", FIELD_FIRST_NAME);

        // Last name aliases
        registerAlias("last_name", FIELD_LAST_NAME);
        registerAlias("lastname", FIELD_LAST_NAME);
        registerAlias("last", FIELD_LAST_NAME);
        registerAlias("surname", FIELD_LAST_NAME);
        registerAlias("family_name", FIELD_LAST_NAME);
        registerAlias("lname", FIELD_LAST_NAME);

        // Email aliases
        registerAlias("email", FIELD_EMAIL);
        registerAlias("e-mail", FIELD_EMAIL);
        registerAlias("email_address", FIELD_EMAIL);
        registerAlias("mail", FIELD_EMAIL);
        registerAlias("work_email", FIELD_EMAIL);

        // Phone aliases
        registerAlias("phone", FIELD_PHONE);
        registerAlias("telephone", FIELD_PHONE);
        registerAlias("mobile", FIELD_PHONE);
        registerAlias("cell", FIELD_PHONE);
        registerAlias("phone_number", FIELD_PHONE);

        // Job title aliases
        registerAlias("job_title", FIELD_JOB_TITLE);
        registerAlias("jobtitle", FIELD_JOB_TITLE);
        registerAlias("title", FIELD_JOB_TITLE);
        registerAlias("position", FIELD_JOB_TITLE);
        registerAlias("role", FIELD_JOB_TITLE);

        // Status aliases
        registerAlias("status", FIELD_STATUS);
        registerAlias("contact_status", FIELD_STATUS);
        registerAlias("stage", FIELD_STATUS);
        registerAlias("lifecycle_status", FIELD_STATUS);

        // Notes aliases
        registerAlias("notes", FIELD_NOTES);
        registerAlias("description", FIELD_NOTES);
        registerAlias("comments", FIELD_NOTES);
        registerAlias("memo", FIELD_NOTES);

        // Account / Company aliases
        registerAlias("account", FIELD_ACCOUNT);
        registerAlias("company", FIELD_ACCOUNT);
        registerAlias("organization", FIELD_ACCOUNT);
        registerAlias("account_name", FIELD_ACCOUNT);
        registerAlias("company_name", FIELD_ACCOUNT);
        registerAlias("org", FIELD_ACCOUNT);
        registerAlias("domain", FIELD_ACCOUNT);
    }

    private static void registerAlias(String alias, String canonicalField) {
        ALIAS_MAP.put(alias.toLowerCase(Locale.ROOT), canonicalField);
    }

    /**
     * Resolves the canonical Contact field for a raw header name.
     */
    public String resolveField(String rawHeader) {
        if (rawHeader == null) {
            return null;
        }
        String clean = rawHeader.trim().toLowerCase(Locale.ROOT).replace(" ", "_").replace("-", "_");
        return ALIAS_MAP.get(clean);
    }

    /**
     * Generates field mapping for the entire header row.
     */
    public Map<String, String> mapHeaders(List<String> headers, Map<String, String> userOverrides) {
        Map<String, String> mapping = new HashMap<>();
        for (String header : headers) {
            if (header == null || header.trim().isEmpty()) {
                continue;
            }
            String trimmed = header.trim();
            if (userOverrides != null && userOverrides.containsKey(trimmed)) {
                mapping.put(trimmed, userOverrides.get(trimmed));
            } else {
                String resolved = resolveField(trimmed);
                if (resolved != null) {
                    mapping.put(trimmed, resolved);
                }
            }
        }
        return mapping;
    }
}

