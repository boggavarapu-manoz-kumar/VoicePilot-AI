package com.voicepilot.contacts.service.exporting;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class ContactCsvSerializerTest {

    private final ContactCsvSerializer serializer = new ContactCsvSerializer();

    @Test
    @DisplayName("Serializes header with standard column names")
    void testWriteHeader() {
        String header = serializer.writeHeader();
        assertThat(header).contains("First Name,Last Name,Email,Phone,Job Title,Status,Account Name,Account Domain,Notes,Created At");
    }

    @Test
    @DisplayName("Escapes comma and quotes in values properly")
    void testEscapesCommasAndQuotes() {
        String row = serializer.writeRow(
                "Bruce",
                "Wayne, Jr.",
                "bruce@wayne.corp",
                "+1-555-0100",
                "CEO \"Chairman\"",
                "CUSTOMER",
                "Wayne Enterprises",
                "wayne.corp",
                "Billionaire, Philanthropist",
                Instant.parse("2026-11-02T12:00:00Z")
        );

        assertThat(row).contains("\"Wayne, Jr.\"");
        assertThat(row).contains("\"CEO \"\"Chairman\"\"\"");
        assertThat(row).contains("\"Billionaire, Philanthropist\"");
    }

    @Test
    @DisplayName("Neutralizes formula injection starting with =, +, -, @, tab, cr")
    void testNeutralizesFormulaInjection() {
        String row = serializer.writeRow(
                "=cmd|' /C calc'!A0",
                "+12345",
                "-SUM(A1:A10)",
                "@echo",
                "Engineer",
                "LEAD",
                "",
                "",
                "\tDangerousTab",
                Instant.parse("2026-11-02T12:00:00Z")
        );

        assertThat(row).contains("\"'=cmd|' /C calc'!A0\"");
        assertThat(row).contains("\"'+12345\"");
        assertThat(row).contains("\"'-SUM(A1:A10)\"");
        assertThat(row).contains("\"'@echo\"");
        assertThat(row).contains("\"'\tDangerousTab\"");
    }

    @Test
    @DisplayName("Handles null and empty values cleanly without throwing")
    void testHandlesNullValues() {
        String row = serializer.writeRow(
                "Diana",
                "Prince",
                "diana@themyscira.gov",
                null,
                null,
                "PROSPECT",
                null,
                null,
                null,
                null
        );

        assertThat(row).startsWith("Diana,Prince,diana@themyscira.gov,\"\",\"\",PROSPECT,\"\",\"\",\"\",");
    }
}

