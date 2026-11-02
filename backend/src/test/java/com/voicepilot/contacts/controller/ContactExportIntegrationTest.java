package com.voicepilot.contacts.controller;

import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.ContactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContactExportIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private ContactRepository contactRepository;

        @Autowired
        private AccountRepository accountRepository;

        @BeforeEach
        void setUp() {
                contactRepository.deleteAll();
                accountRepository.deleteAll();
        }

        @Test
        @DisplayName("1. Exports all contacts as streaming CSV with UTF-8 BOM and correct headers")
        void testExportAllContacts() throws Exception {
                Account account = new Account("Wayne Enterprises");
                account.setDomain("wayne.corp");
                accountRepository.save(account);

                Contact c1 = new Contact("Bruce", "Wayne", "bruce@wayne.corp", "+1-555-0100", "CEO",
                                ContactStatus.CUSTOMER, "Notes", account);
                Contact c2 = new Contact("Clark", "Kent", "clark@dailyplanet.com", null, "Reporter", ContactStatus.LEAD,
                                null, null);
                contactRepository.save(c1);
                contactRepository.save(c2);

                MvcResult mvcResult = mockMvc.perform(get("/api/v1/contacts/export"))
                                .andExpect(request().asyncStarted())
                                .andExpect(status().isOk())
                                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                                                containsString("attachment; filename=\"contacts_export_")))
                                .andExpect(header().string(HttpHeaders.CONTENT_TYPE, containsString("text/csv")))
                                .andReturn();

                mockMvc.perform(asyncDispatch(mvcResult))
                                .andExpect(status().isOk());

                byte[] contentBytes = mvcResult.getResponse().getContentAsByteArray();

                // Check UTF-8 BOM (0xEF, 0xBB, 0xBF)
                assertThat(contentBytes[0]).isEqualTo((byte) 0xEF);
                assertThat(contentBytes[1]).isEqualTo((byte) 0xBB);
                assertThat(contentBytes[2]).isEqualTo((byte) 0xBF);

                String csvString = new String(contentBytes, java.nio.charset.StandardCharsets.UTF_8);
                assertThat(csvString).contains(
                                "First Name,Last Name,Email,Phone,Job Title,Status,Account Name,Account Domain,Notes,Created At");
                assertThat(csvString).contains("Bruce,Wayne,bruce@wayne.corp");
                assertThat(csvString).contains("Wayne Enterprises");
                assertThat(csvString).contains("Clark,Kent,clark@dailyplanet.com");
        }

        @Test
        @DisplayName("2. Filters export by search query and contact status")
        void testFilterExportBySearchAndStatus() throws Exception {
                Contact c1 = new Contact("Bruce", "Wayne", "bruce@wayne.corp", null, null, ContactStatus.CUSTOMER, null,
                                null);
                Contact c2 = new Contact("Diana", "Prince", "diana@themyscira.gov", null, null, ContactStatus.PROSPECT,
                                null, null);
                contactRepository.save(c1);
                contactRepository.save(c2);

                MvcResult mvcResult = mockMvc.perform(get("/api/v1/contacts/export")
                                .param("status", "PROSPECT"))
                                .andExpect(request().asyncStarted())
                                .andExpect(status().isOk())
                                .andReturn();

                mockMvc.perform(asyncDispatch(mvcResult))
                                .andExpect(status().isOk());

                String csvString = mvcResult.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
                assertThat(csvString).contains("Diana,Prince,diana@themyscira.gov");
                assertThat(csvString).doesNotContain("Bruce,Wayne");
        }

        @Test
        @DisplayName("3. Filters export by explicit list of contact IDs")
        void testFilterExportByExplicitIds() throws Exception {
                Contact c1 = new Contact("Bruce", "Wayne", "bruce@wayne.corp", null, null, ContactStatus.CUSTOMER, null,
                                null);
                Contact c2 = new Contact("Barry", "Allen", "barry@ccpd.gov", null, null, ContactStatus.LEAD, null,
                                null);
                Contact saved1 = contactRepository.save(c1);
                contactRepository.save(c2);

                MvcResult mvcResult = mockMvc.perform(get("/api/v1/contacts/export")
                                .param("ids", saved1.getId().toString()))
                                .andExpect(request().asyncStarted())
                                .andExpect(status().isOk())
                                .andReturn();

                mockMvc.perform(asyncDispatch(mvcResult))
                                .andExpect(status().isOk());

                String csvString = mvcResult.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
                assertThat(csvString).contains("Bruce,Wayne");
                assertThat(csvString).doesNotContain("Barry,Allen");
        }

        @Test
        @DisplayName("4. Empty export returns valid header only without error")
        void testEmptyExport() throws Exception {
                MvcResult mvcResult = mockMvc.perform(get("/api/v1/contacts/export"))
                                .andExpect(request().asyncStarted())
                                .andExpect(status().isOk())
                                .andReturn();

                mockMvc.perform(asyncDispatch(mvcResult))
                                .andExpect(status().isOk());

                String csvString = mvcResult.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
                assertThat(csvString).contains("First Name,Last Name,Email");
        }
}
