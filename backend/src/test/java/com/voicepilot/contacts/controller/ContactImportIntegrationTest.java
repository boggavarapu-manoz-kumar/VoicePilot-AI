package com.voicepilot.contacts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.contacts.dto.importing.DuplicatePolicy;
import com.voicepilot.contacts.dto.importing.ImportExecutionRequest;
import com.voicepilot.contacts.dto.importing.ImportPreviewResponse;
import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.ContactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactImportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        contactRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Preview valid CSV returns correct stats and zero database side effects")
    void testPreviewValidCsvWithoutSideEffects() throws Exception {
        Account account = new Account("Wayne Enterprises");
        account.setDomain("wayne.corp");
        accountRepository.save(account);

        String csvContent = "First Name,Last Name,Email,Phone,Job Title,Status,Account\n" +
                "Bruce,Wayne,bruce@wayne.corp,+1-555-0100,CEO,CUSTOMER,wayne.corp\n" +
                "Clark,Kent,clark@dailyplanet.com,,Reporter,LEAD,Daily Planet";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "contacts.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        long contactsBefore = contactRepository.count();

        mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.data.totalRows").value(2))
                .andExpect(jsonPath("$.data.validRowCount").value(2))
                .andExpect(jsonPath("$.data.invalidRowCount").value(0))
                .andExpect(jsonPath("$.data.duplicateCount").value(0))
                .andExpect(jsonPath("$.data.sampleRows[0].firstName").value("Bruce"))
                .andExpect(jsonPath("$.data.sampleRows[0].matchedAccountId").value(account.getId()));

        // Verification of ZERO database changes during preview
        assertThat(contactRepository.count()).isEqualTo(contactsBefore);
    }

    @Test
    @DisplayName("2. Preview detects duplicate candidates against existing database records")
    void testPreviewDetectsDuplicates() throws Exception {
        Contact existing = new Contact("Bruce", "Wayne", "bruce@wayne.corp");
        contactRepository.save(existing);

        String csvContent = "First Name,Last Name,Email\n" +
                "Bruce,Wayne,bruce@wayne.corp\n" +
                "Diana,Prince,diana@themyscira.gov";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "contacts.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRows").value(2))
                .andExpect(jsonPath("$.data.validRowCount").value(2))
                .andExpect(jsonPath("$.data.duplicateCount").value(1))
                .andExpect(jsonPath("$.data.sampleRows[0].duplicate").value(true))
                .andExpect(jsonPath("$.data.sampleRows[0].matchedContactId").value(existing.getId()));
    }

    @Test
    @DisplayName("3. Preview returns validation errors for missing or invalid required fields")
    void testPreviewValidationErrors() throws Exception {
        String csvContent = "First Name,Last Name,Email\n" +
                ",Wayne,invalid-email\n" +
                "Clark,,clark@dailyplanet.com";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "invalid.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRows").value(2))
                .andExpect(jsonPath("$.data.validRowCount").value(0))
                .andExpect(jsonPath("$.data.invalidRowCount").value(2))
                .andExpect(jsonPath("$.data.validationErrors", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("4. Execute import persists records and associates existing accounts")
    void testExecuteImportSuccess() throws Exception {
        Account account = new Account("Stark Industries");
        account.setDomain("stark.com");
        accountRepository.save(account);

        String csvContent = "First Name,Last Name,Email,Account\n" +
                "Tony,Stark,tony@stark.com,stark.com\n" +
                "Pepper,Potts,pepper@stark.com,Stark Industries";

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "contacts.csv",
                "text/csv",
                csvContent.getBytes(StandardCharsets.UTF_8)
        );

        // 1. Preview
        MvcResult previewResult = mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = previewResult.getResponse().getContentAsString();
        String sessionId = objectMapper.readTree(responseBody).get("data").get("sessionId").asText();

        // 2. Execute
        ImportExecutionRequest request = new ImportExecutionRequest(sessionId, DuplicatePolicy.SKIP, true);

        mockMvc.perform(post("/contacts/import/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.importedCount").value(2))
                .andExpect(jsonPath("$.data.skippedCount").value(0))
                .andExpect(jsonPath("$.data.failedCount").value(0));

        // 3. Verify in DB
        assertThat(contactRepository.count()).isEqualTo(2);
        Contact tony = contactRepository.findByEmailIgnoreCase("tony@stark.com").orElseThrow();
        assertThat(tony.getAccount()).isNotNull();
        assertThat(tony.getAccount().getId()).isEqualTo(account.getId());
    }

    @Test
    @DisplayName("5. Execute rejects second execution attempt for the same session (Idempotency/Replay Defense)")
    void testExecuteReplayDefense() throws Exception {
        String csvContent = "First Name,Last Name,Email\nPeter,Parker,peter@dailybugle.com";
        MockMultipartFile file = new MockMultipartFile("file", "peter.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        MvcResult previewResult = mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String sessionId = objectMapper.readTree(previewResult.getResponse().getContentAsString()).get("data").get("sessionId").asText();
        ImportExecutionRequest request = new ImportExecutionRequest(sessionId, DuplicatePolicy.SKIP, true);

        // First execution succeeds
        mockMvc.perform(post("/contacts/import/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Second execution rejected with 404/409
        mockMvc.perform(post("/contacts/import/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("6. Execute honors REJECT_ALL duplicate policy and rolls back completely")
    void testExecuteRejectsOnDuplicatePolicy() throws Exception {
        Contact existing = new Contact("Bruce", "Wayne", "bruce@wayne.corp");
        contactRepository.save(existing);

        String csvContent = "First Name,Last Name,Email\n" +
                "Bruce,Wayne,bruce@wayne.corp\n" +
                "Barry,Allen,barry@ccpd.gov";

        MockMultipartFile file = new MockMultipartFile("file", "contacts.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));
        MvcResult previewResult = mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isOk())
                .andReturn();

        String sessionId = objectMapper.readTree(previewResult.getResponse().getContentAsString()).get("data").get("sessionId").asText();
        ImportExecutionRequest request = new ImportExecutionRequest(sessionId, DuplicatePolicy.REJECT_ALL, true);

        mockMvc.perform(post("/contacts/import/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());

        // Barry Allen should NOT have been imported
        assertThat(contactRepository.count()).isEqualTo(1);
        assertThat(contactRepository.findByEmailIgnoreCase("barry@ccpd.gov")).isEmpty();
    }

    @Test
    @DisplayName("7. Rejects missing required columns in headers with HTTP 400")
    void testRejectsMissingRequiredHeaders() throws Exception {
        String csvContent = "Phone,Notes\n+1-555-0100,Test Notes";
        MockMultipartFile file = new MockMultipartFile("file", "missing_headers.csv", "text/csv", csvContent.getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(multipart("/contacts/import/preview").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("Missing required column")));
    }
}

