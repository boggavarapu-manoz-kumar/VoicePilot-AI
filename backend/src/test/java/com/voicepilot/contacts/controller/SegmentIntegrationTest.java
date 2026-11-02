package com.voicepilot.contacts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.contacts.dto.CreateSegmentRequest;
import com.voicepilot.contacts.dto.SegmentFilterCriteria;
import com.voicepilot.contacts.dto.UpdateSegmentRequest;
import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.ContactRepository;
import com.voicepilot.contacts.repository.SegmentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SegmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SegmentRepository segmentRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        segmentRepository.deleteAll();
        contactRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @AfterEach
    void tearDown() {
        segmentRepository.deleteAll();
        contactRepository.deleteAll();
        accountRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/segments - creates a new saved segment and returns contact count")
    void shouldCreateSegment() throws Exception {
        Account acme = accountRepository.save(new Account("Acme Corp"));
        contactRepository.save(new Contact("Alice", "Smith", "alice@acme.com", "+1234", "VP", ContactStatus.LEAD, null, acme));
        contactRepository.save(new Contact("Bob", "Jones", "bob@acme.com", "+1235", "Director", ContactStatus.CUSTOMER, null, acme));

        SegmentFilterCriteria criteria = new SegmentFilterCriteria(null, ContactStatus.LEAD, null, null);
        CreateSegmentRequest request = new CreateSegmentRequest("Leads Only", "All active leads", criteria);

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Leads Only"))
                .andExpect(jsonPath("$.data.description").value("All active leads"))
                .andExpect(jsonPath("$.data.filterCriteria.status").value("LEAD"))
                .andExpect(jsonPath("$.data.matchingContactCount").value(1));

        assertThat(segmentRepository.findByName("Leads Only")).isPresent();
    }

    @Test
    @DisplayName("POST /api/v1/segments - rejects duplicate segment name with 409 Conflict")
    void shouldRejectDuplicateSegmentName() throws Exception {
        SegmentFilterCriteria criteria = new SegmentFilterCriteria(null, ContactStatus.LEAD, null, null);
        CreateSegmentRequest request = new CreateSegmentRequest("Duplicate Segment", "desc", criteria);

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/v1/segments - rejects blank name and null criteria")
    void shouldRejectInvalidSegmentRequest() throws Exception {
        CreateSegmentRequest request = new CreateSegmentRequest("", "desc", null);

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/segments - lists saved segments with live contact counts")
    void shouldListSegments() throws Exception {
        contactRepository.save(new Contact("Alice", "Smith", "alice@example.com", null, null, ContactStatus.LEAD, null, null));

        SegmentFilterCriteria criteria = new SegmentFilterCriteria(null, ContactStatus.LEAD, null, null);
        CreateSegmentRequest request1 = new CreateSegmentRequest("Segment 1", "desc 1", criteria);
        CreateSegmentRequest request2 = new CreateSegmentRequest("Segment 2", "desc 2", SegmentFilterCriteria.empty());

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/segments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/segments/{id} - returns segment details or 404")
    void shouldGetSegmentById() throws Exception {
        SegmentFilterCriteria criteria = new SegmentFilterCriteria("Alice", null, null, null);
        CreateSegmentRequest request = new CreateSegmentRequest("Find Alice", "Alice search", criteria);

        MvcResult result = mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        long id = objectMapper.readTree(responseBody).get("data").get("id").asLong();

        mockMvc.perform(get("/segments/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(id))
                .andExpect(jsonPath("$.data.name").value("Find Alice"))
                .andExpect(jsonPath("$.data.filterCriteria.search").value("Alice"));

        mockMvc.perform(get("/segments/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/v1/segments/{id} - updates segment name and filter definition")
    void shouldUpdateSegment() throws Exception {
        SegmentFilterCriteria initial = new SegmentFilterCriteria(null, ContactStatus.LEAD, null, null);
        CreateSegmentRequest createReq = new CreateSegmentRequest("Original Name", "desc", initial);

        MvcResult result = mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        SegmentFilterCriteria updatedCriteria = new SegmentFilterCriteria("newsearch", ContactStatus.CUSTOMER, null, true);
        UpdateSegmentRequest updateReq = new UpdateSegmentRequest("Updated Name", "new desc", updatedCriteria);

        mockMvc.perform(put("/segments/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Name"))
                .andExpect(jsonPath("$.data.filterCriteria.status").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.filterCriteria.withoutAccount").value(true));
    }

    @Test
    @DisplayName("DELETE /api/v1/segments/{id} - removes segment without touching contacts")
    void shouldDeleteSegment() throws Exception {
        contactRepository.save(new Contact("Alice", "Smith", "alice@example.com", null, null, ContactStatus.LEAD, null, null));

        SegmentFilterCriteria criteria = SegmentFilterCriteria.empty();
        CreateSegmentRequest request = new CreateSegmentRequest("To Delete", null, criteria);

        MvcResult result = mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(delete("/segments/" + id))
                .andExpect(status().isOk());

        mockMvc.perform(get("/segments/" + id))
                .andExpect(status().isNotFound());

        // Ensure contact still exists
        assertThat(contactRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("GET /api/v1/segments/{id}/contacts - executes filter and returns matching contacts")
    void shouldGetMatchingContactsForSegment() throws Exception {
        Account techCorp = accountRepository.save(new Account("Tech Corp"));
        contactRepository.save(new Contact("Jane", "Doe", "jane@techcorp.com", "+111", "CTO", ContactStatus.CUSTOMER, null, techCorp));
        contactRepository.save(new Contact("John", "Doe", "john@techcorp.com", "+222", "Dev", ContactStatus.LEAD, null, techCorp));
        contactRepository.save(new Contact("No", "Account", "no@test.com", null, null, ContactStatus.CUSTOMER, null, null));

        // Segment: Customers at Tech Corp
        SegmentFilterCriteria criteria = new SegmentFilterCriteria(null, ContactStatus.CUSTOMER, techCorp.getId(), false);
        CreateSegmentRequest request = new CreateSegmentRequest("TechCorp Customers", null, criteria);

        MvcResult result = mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(get("/segments/" + id + "/contacts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].firstName").value("Jane"))
                .andExpect(jsonPath("$.data.content[0].email").value("jane@techcorp.com"));
    }

    @Test
    @DisplayName("GET /api/v1/segments/{id}/export - streams CSV export of segment contacts")
    void shouldExportSegmentContactsCsv() throws Exception {
        contactRepository.save(new Contact("Lead", "One", "lead1@example.com", null, null, ContactStatus.LEAD, null, null));
        contactRepository.save(new Contact("Cust", "Two", "cust2@example.com", null, null, ContactStatus.CUSTOMER, null, null));

        SegmentFilterCriteria criteria = new SegmentFilterCriteria(null, ContactStatus.LEAD, null, null);
        CreateSegmentRequest request = new CreateSegmentRequest("Export Leads", null, criteria);

        MvcResult result = mockMvc.perform(post("/segments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        long id = objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("id").asLong();

        MvcResult exportResult = mockMvc.perform(get("/segments/" + id + "/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", containsString("text/csv")))
                .andExpect(header().string("Content-Disposition", containsString("segment_Export_Leads_")))
                .andReturn();

        // Trigger async execution
        exportResult.getRequest().getAsyncContext();
        mockMvc.perform(asyncDispatch(exportResult))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("lead1@example.com")))
                .andExpect(content().string(not(containsString("cust2@example.com"))));
    }
}
