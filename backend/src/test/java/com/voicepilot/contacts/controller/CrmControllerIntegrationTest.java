package com.voicepilot.contacts.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.contacts.dto.CreateAccountRequest;
import com.voicepilot.contacts.dto.CreateContactRequest;
import com.voicepilot.contacts.dto.UpdateContactRequest;
import com.voicepilot.contacts.model.AccountStatus;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.ContactRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CrmControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private AccountRepository accountRepository;

    // Helper to create an account and return its ID
    private Long createTestAccount(String name, String domain) throws Exception {
        CreateAccountRequest request = new CreateAccountRequest(
                name,
                domain,
                "Technology",
                "+1-555-0100",
                "https://" + domain,
                AccountStatus.ACTIVE
        );

        MvcResult result = mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        return objectMapper.readTree(responseBody).path("data").path("id").asLong();
    }

    // Helper to create a contact and return its ID
    private Long createTestContact(String firstName, String lastName, String email, Long accountId, ContactStatus status) throws Exception {
        CreateContactRequest request = new CreateContactRequest(
                firstName,
                lastName,
                email,
                "+1-555-0199",
                "Engineer",
                status != null ? status : ContactStatus.LEAD,
                "Notes here",
                accountId
        );

        MvcResult result = mockMvc.perform(post("/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        return objectMapper.readTree(responseBody).path("data").path("id").asLong();
    }

    @Test
    @DisplayName("1. Create contact successfully with valid payload returns HTTP 201")
    void testCreateContactSuccess() throws Exception {
        Long accountId = createTestAccount("Acme Corp", "acme.com");

        CreateContactRequest request = new CreateContactRequest(
                "Alice",
                "Smith",
                "alice.smith@acme.com",
                "+1-555-0123",
                "Product Manager",
                ContactStatus.PROSPECT,
                "Met at conference",
                accountId
        );

        mockMvc.perform(post("/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Contact created successfully")))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.firstName", is("Alice")))
                .andExpect(jsonPath("$.data.lastName", is("Smith")))
                .andExpect(jsonPath("$.data.email", is("alice.smith@acme.com")))
                .andExpect(jsonPath("$.data.status", is("PROSPECT")))
                .andExpect(jsonPath("$.data.account.id", is(accountId.intValue())))
                .andExpect(jsonPath("$.data.account.name", is("Acme Corp")))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("2. Retrieve contact by ID returns HTTP 200 with full details")
    void testRetrieveContactSuccess() throws Exception {
        Long contactId = createTestContact("Bob", "Jones", "bob@example.com", null, ContactStatus.LEAD);

        mockMvc.perform(get("/contacts/{id}", contactId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(contactId.intValue())))
                .andExpect(jsonPath("$.data.firstName", is("Bob")))
                .andExpect(jsonPath("$.data.lastName", is("Jones")))
                .andExpect(jsonPath("$.data.email", is("bob@example.com")));
    }

    @Test
    @DisplayName("3. Update contact successfully returns HTTP 200")
    void testUpdateContactSuccess() throws Exception {
        Long contactId = createTestContact("Charlie", "Brown", "charlie@example.com", null, ContactStatus.LEAD);

        UpdateContactRequest updateRequest = new UpdateContactRequest(
                "Charles",
                "Brown",
                "charles.brown@example.com",
                "+1-555-9999",
                "Lead Architect",
                ContactStatus.CUSTOMER,
                "Upgraded customer",
                null
        );

        mockMvc.perform(put("/contacts/{id}", contactId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(contactId.intValue())))
                .andExpect(jsonPath("$.data.firstName", is("Charles")))
                .andExpect(jsonPath("$.data.status", is("CUSTOMER")));
    }

    @Test
    @DisplayName("4. Delete contact returns HTTP 200 and subsequent fetch returns HTTP 404")
    void testDeleteContactSuccess() throws Exception {
        Long contactId = createTestContact("David", "Miller", "david@example.com", null, ContactStatus.LEAD);

        mockMvc.perform(delete("/contacts/{id}", contactId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Contact deleted successfully")));

        mockMvc.perform(get("/contacts/{id}", contactId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")));
    }

    @Test
    @DisplayName("5. Search contacts by partial text across names, email, and phone")
    void testSearchContacts() throws Exception {
        createTestContact("Eleanor", "Rigby", "eleanor@beatles.com", null, ContactStatus.LEAD);
        createTestContact("John", "Lennon", "john@beatles.com", null, ContactStatus.CUSTOMER);

        mockMvc.perform(get("/contacts").param("search", "rigby"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].firstName", is("Eleanor")));

        mockMvc.perform(get("/contacts").param("search", "beatles.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)));
    }

    @Test
    @DisplayName("6. Filter contacts by status")
    void testFilterContactsByStatus() throws Exception {
        createTestContact("User1", "Test", "u1@test.com", null, ContactStatus.LEAD);
        createTestContact("User2", "Test", "u2@test.com", null, ContactStatus.CUSTOMER);

        mockMvc.perform(get("/contacts").param("status", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email", is("u2@test.com")));
    }

    @Test
    @DisplayName("7. Filter contacts by account ID")
    void testFilterContactsByAccount() throws Exception {
        Long acc1 = createTestAccount("Company A", "compa.com");
        Long acc2 = createTestAccount("Company B", "compb.com");

        createTestContact("User1", "Test", "u1@compa.com", acc1, ContactStatus.LEAD);
        createTestContact("User2", "Test", "u2@compb.com", acc2, ContactStatus.LEAD);

        mockMvc.perform(get("/contacts").param("accountId", acc1.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].email", is("u1@compa.com")));
    }

    @Test
    @DisplayName("8. Pagination controls page size and page indexing")
    void testContactPagination() throws Exception {
        for (int i = 1; i <= 5; i++) {
            createTestContact("User" + i, "Batch", "batch" + i + "@example.com", null, ContactStatus.LEAD);
        }

        mockMvc.perform(get("/contacts").param("page", "0").param("size", "2").param("sort", "email"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(2)))
                .andExpect(jsonPath("$.data.totalElements", is(5)))
                .andExpect(jsonPath("$.data.totalPages", is(3)));
    }

    @Test
    @DisplayName("9. Reject contact creation with invalid email format (HTTP 400 + VALIDATION_FAILED)")
    void testCreateContactInvalidEmail() throws Exception {
        CreateContactRequest request = new CreateContactRequest(
                "Bad",
                "Email",
                "not-an-email",
                null,
                null,
                ContactStatus.LEAD,
                null,
                null
        );

        mockMvc.perform(post("/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_FAILED")))
                .andExpect(jsonPath("$.error.details[0].field", is("email")));
    }

    @Test
    @DisplayName("10. Reject contact creation with blank first name or last name (HTTP 400)")
    void testCreateContactBlankNames() throws Exception {
        CreateContactRequest request = new CreateContactRequest(
                "   ",
                "",
                "valid@example.com",
                null,
                null,
                ContactStatus.LEAD,
                null,
                null
        );

        mockMvc.perform(post("/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_FAILED")))
                .andExpect(jsonPath("$.error.details", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("11. Retrieve missing contact ID returns HTTP 404 + NOT_FOUND code")
    void testGetNonExistentContact() throws Exception {
        mockMvc.perform(get("/contacts/{id}", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")))
                .andExpect(jsonPath("$.error.message", containsString("999999")));
    }

    @Test
    @DisplayName("12. Creating contact with missing account ID returns HTTP 404")
    void testCreateContactNonExistentAccount() throws Exception {
        CreateContactRequest request = new CreateContactRequest(
                "Jane",
                "Doe",
                "jane@example.com",
                null,
                null,
                ContactStatus.LEAD,
                null,
                999999L
        );

        mockMvc.perform(post("/contacts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")))
                .andExpect(jsonPath("$.error.message", containsString("999999")));
    }

    @Test
    @DisplayName("13. Error response matches standard envelope format (success, error{code, message}, timestamp)")
    void testErrorResponseStructure() throws Exception {
        mockMvc.perform(get("/contacts/{id}", 888888L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error", notNullValue()))
                .andExpect(jsonPath("$.error.code", notNullValue()))
                .andExpect(jsonPath("$.error.message", notNullValue()))
                .andExpect(jsonPath("$.timestamp", notNullValue()));
    }

    @Test
    @DisplayName("14. Correct HTTP status codes on account endpoints (201, 200, 404, 400)")
    void testAccountEndpointsStatusCodes() throws Exception {
        // 400 on blank account name
        CreateAccountRequest invalidAcc = new CreateAccountRequest("", null, null, null, null, null);
        mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidAcc)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code", is("VALIDATION_FAILED")));

        // 201 on valid account create
        CreateAccountRequest validAcc = new CreateAccountRequest("Global Logistics", "globallogistics.com", "Logistics", null, null, AccountStatus.ACTIVE);
        MvcResult res = mockMvc.perform(post("/accounts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validAcc)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name", is("Global Logistics")))
                .andReturn();

        Long accId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("id").asLong();

        // 200 on get account
        mockMvc.perform(get("/accounts/{id}", accId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(accId.intValue())));

        // 404 on missing account
        mockMvc.perform(get("/accounts/{id}", 777777L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code", is("NOT_FOUND")));
    }

    @Test
    @DisplayName("15. Existing health endpoint remains functional and unaffected")
    void testHealthEndpointUnaffected() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("UP")));
    }

    @Test
    @DisplayName("16. Existing CORS restrictions are respected on CRM endpoints")
    void testCorsRestrictionsOnCrmEndpoints() throws Exception {
        // Allowed origin
        mockMvc.perform(options("/contacts")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));

        // Disallowed origin
        mockMvc.perform(options("/contacts")
                        .header("Origin", "http://untrusted-domain.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
