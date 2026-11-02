package com.voicepilot.contacts.service.exporting;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Enterprise RFC 4180 CSV serializer with built-in formula injection neutralization
 * and safe UTF-8 character encoding.
 */
@Component
public class ContactCsvSerializer {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    public static final List<String> CSV_HEADERS = List.of(
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Job Title",
            "Status",
            "Account Name",
            "Account Domain",
            "Notes",
            "Created At"
    );

    /**
     * Serializes the header row.
     */
    public String writeHeader() {
        return String.join(",", CSV_HEADERS) + "\r\n";
    }

    /**
     * Serializes a single record into an RFC 4180 compliant CSV line.
     */
    public String writeRow(
            String firstName,
            String lastName,
            String email,
            String phone,
            String jobTitle,
            String status,
            String accountName,
            String accountDomain,
            String notes,
            Instant createdAt
    ) {
        StringBuilder sb = new StringBuilder();
        appendCell(sb, firstName, false);
        appendCell(sb, lastName, false);
        appendCell(sb, email, false);
        appendCell(sb, phone, false);
        appendCell(sb, jobTitle, false);
        appendCell(sb, status, false);
        appendCell(sb, accountName, false);
        appendCell(sb, accountDomain, false);
        appendCell(sb, notes, false);
        appendCell(sb, createdAt != null ? ISO_FORMATTER.format(createdAt) : "", true);
        sb.append("\r\n");
        return sb.toString();
    }

    private void appendCell(StringBuilder sb, String value, boolean isLast) {
        String sanitized = sanitizeAndEscape(value);
        sb.append(sanitized);
        if (!isLast) {
            sb.append(",");
        }
    }

    /**
     * Neutralizes spreadsheet formula injection (DDE attacks) and applies RFC 4180 quoting.
     */
    public String sanitizeAndEscape(String value) {
        if (value == null || value.isEmpty()) {
            return "\"\"";
        }

        // Formula injection defense: cells starting with '=', '+', '-', '@', '\t', '\r'
        char firstChar = value.charAt(0);
        String safeValue = value;
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            safeValue = "'" + value;
        }

        // If the value contains quotes, commas, tabs, or newlines, quote the field and double existing quotes
        boolean needsQuotes = safeValue.contains(",") || safeValue.contains("\"") || safeValue.contains("\n") || safeValue.contains("\r") || safeValue.contains("\t");
        if (needsQuotes || safeValue.startsWith("'")) {
            return "\"" + safeValue.replace("\"", "\"\"") + "\"";
        }

        return safeValue;
    }
}

