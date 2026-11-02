package com.voicepilot.contacts.service.importing;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CsvStreamParserTest {

    private final CsvStreamParser parser = new CsvStreamParser();

    @Test
    @DisplayName("Parses standard comma-separated CSV with headers and rows")
    void testStandardCsvParsing() throws IOException {
        String csv = "First Name,Last Name,Email\nJohn,Doe,john@example.com\nJane,Smith,jane@example.com";
        ByteArrayInputStream is = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));

        List<List<String>> rows = parser.parse(is, 100);

        assertThat(rows).hasSize(3);
        assertThat(rows.get(0)).containsExactly("First Name", "Last Name", "Email");
        assertThat(rows.get(1)).containsExactly("John", "Doe", "john@example.com");
        assertThat(rows.get(2)).containsExactly("Jane", "Smith", "jane@example.com");
    }

    @Test
    @DisplayName("Handles quoted cells with commas and newlines correctly")
    void testQuotedCellsWithSpecialCharacters() throws IOException {
        String csv = "Name,Notes\n\"Wayne, Bruce\",\"Billionaire\nPhilanthropist\"\n\"Kent, Clark\",\"Reporter\"";
        ByteArrayInputStream is = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));

        List<List<String>> rows = parser.parse(is, 100);

        assertThat(rows).hasSize(3);
        assertThat(rows.get(1).get(0)).isEqualTo("Wayne, Bruce");
        assertThat(rows.get(1).get(1)).contains("Billionaire\nPhilanthropist");
    }

    @Test
    @DisplayName("Strips UTF-8 Byte Order Mark (BOM) transparently from first cell")
    void testUtf8BomStripping() throws IOException {
        byte[] bom = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] text = "First Name,Last Name\nAlice,Wonderland".getBytes(StandardCharsets.UTF_8);
        byte[] combined = new byte[bom.length + text.length];
        System.arraycopy(bom, 0, combined, 0, bom.length);
        System.arraycopy(text, 0, combined, bom.length, text.length);

        ByteArrayInputStream is = new ByteArrayInputStream(combined);
        List<List<String>> rows = parser.parse(is, 100);

        assertThat(rows).hasSize(2);
        assertThat(rows.get(0).get(0)).isEqualTo("First Name");
    }

    @Test
    @DisplayName("Neutralizes CSV formula injection starting with =, +, -, @")
    void testFormulaInjectionNeutralization() throws IOException {
        String csv = "First Name,Formula\nBruce,=cmd|' /C calc'!A0\nClark,+12345\nDiana,-SUM(A1:A10)";
        ByteArrayInputStream is = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));

        List<List<String>> rows = parser.parse(is, 100);

        assertThat(rows.get(1).get(1)).isEqualTo("'=cmd|' /C calc'!A0");
        assertThat(rows.get(2).get(1)).isEqualTo("'+12345");
        assertThat(rows.get(3).get(1)).isEqualTo("'-SUM(A1:A10)");
    }

    @Test
    @DisplayName("Enforces maximum row limit exception")
    void testMaxRowLimitEnforced() {
        String csv = "First Name,Last Name\n1,A\n2,B\n3,C\n4,D";
        ByteArrayInputStream is = new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> parser.parse(is, 2))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("CSV exceeds maximum allowed limit of 2 rows");
    }
}

