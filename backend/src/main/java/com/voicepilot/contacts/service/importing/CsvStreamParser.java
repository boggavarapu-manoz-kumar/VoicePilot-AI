package com.voicepilot.contacts.service.importing;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * High-performance, RFC 4180-compliant streaming CSV parser with zero external dependencies.
 * Handles quoted fields containing delimiters, escaped quotes, newlines, UTF-8 BOM,
 * and neutralizes spreadsheet formula injection risks.
 */
@Component
public class CsvStreamParser {

    private static final char DEFAULT_DELIMITER = ',';

    /**
     * Parses the CSV input stream into raw tokenized rows.
     * Enforces row limit to protect server memory and threads.
     *
     * @param inputStream the raw file stream
     * @param maxRows     maximum rows to parse (excluding header)
     * @return list of parsed rows, where index 0 is the header
     * @throws IOException if I/O error or syntax error occurs
     */
    public List<List<String>> parse(InputStream inputStream, int maxRows) throws IOException {
        List<List<String>> rows = new ArrayList<>();
        BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));

        // Read character by character with state machine
        StringBuilder cell = new StringBuilder();
        List<String> currentRow = new ArrayList<>();
        boolean inQuotes = false;
        boolean sawBOM = false;
        char delimiter = DEFAULT_DELIMITER;
        boolean firstLineDetermined = false;

        int ch;
        int rowCount = 0;

        while ((ch = reader.read()) != -1) {
            char c = (char) ch;

            // Handle UTF-8 BOM (\uFEFF) on first char
            if (!sawBOM && rows.isEmpty() && currentRow.isEmpty() && cell.length() == 0 && c == '\uFEFF') {
                sawBOM = true;
                continue;
            }
            sawBOM = true;

            // Dynamically detect delimiter on first non-empty header line if not set
            if (!firstLineDetermined && rows.isEmpty()) {
                if (c == ';' || c == '\t') {
                    delimiter = c;
                }
            }

            if (c == '"') {
                if (inQuotes) {
                    reader.mark(1);
                    int next = reader.read();
                    if (next == '"') {
                        // Escaped quote: "" -> "
                        cell.append('"');
                    } else {
                        // End of quote
                        inQuotes = false;
                        if (next != -1) {
                            reader.reset();
                        }
                    }
                } else {
                    inQuotes = true;
                }
            } else if (c == delimiter && !inQuotes) {
                currentRow.add(sanitizeCell(cell.toString()));
                cell.setLength(0);
            } else if ((c == '\r' || c == '\n') && !inQuotes) {
                // If CRLF, consume LF if this was CR
                if (c == '\r') {
                    reader.mark(1);
                    int next = reader.read();
                    if (next != '\n' && next != -1) {
                        reader.reset();
                    }
                }

                currentRow.add(sanitizeCell(cell.toString()));
                cell.setLength(0);

                if (!currentRow.isEmpty() && !isRowEmpty(currentRow)) {
                    rows.add(new ArrayList<>(currentRow));
                    firstLineDetermined = true;
                    if (rows.size() > 1) { // count data rows (excluding header)
                        rowCount++;
                        if (rowCount > maxRows) {
                            throw new IllegalArgumentException("CSV exceeds maximum allowed limit of " + maxRows + " rows");
                        }
                    }
                }
                currentRow.clear();
            } else {
                cell.append(c);
            }
        }

        // Flush any remaining trailing cell/row
        if (cell.length() > 0 || !currentRow.isEmpty()) {
            currentRow.add(sanitizeCell(cell.toString()));
            if (!isRowEmpty(currentRow)) {
                rows.add(new ArrayList<>(currentRow));
            }
        }

        return rows;
    }

    /**
     * Checks if a row is entirely whitespace or empty cells.
     */
    private boolean isRowEmpty(List<String> row) {
        for (String cell : row) {
            if (cell != null && !cell.trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Trims cell value and protects against CSV formula injection (DDE attacks).
     * If cell starts with '=', '+', '-', '@', '\t', or '\r', prefixes with single quote.
     */
    public String sanitizeCell(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        char firstChar = trimmed.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            return "'" + trimmed;
        }
        return trimmed;
    }
}

