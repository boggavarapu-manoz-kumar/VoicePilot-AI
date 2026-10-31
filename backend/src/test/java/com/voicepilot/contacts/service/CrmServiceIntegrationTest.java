package com.voicepilot.contacts.service;

import com.voicepilot.common.api.PageResponse;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.contacts.dto.AccountResponse;
import com.voicepilot.contacts.dto.ContactResponse;
import com.voicepilot.contacts.dto.CreateAccountRequest;
import com.voicepilot.contacts.dto.CreateContactRequest;
import com.voicepilot.contacts.dto.UpdateAccountRequest;
import com.voicepilot.contacts.dto.UpdateContactRequest;
import com.voicepilot.contacts.model.AccountStatus;
import com.voicepilot.contacts.model.ContactStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class CrmServiceIntegrationTest {

    @Autowired
    private AccountService accountService;

    @Autowired
    private ContactService contactService;

    @Autowired
    private Validator validator;

    @Test
    @DisplayName("Verify Account creation with sanitized fields and default status")
    void testCreateAccount() {
        CreateAccountRequest request = new CreateAccountRequest(
                "  Nova Corp Industries  ",
                "novacorp.com",
                "Manufacturing",
                "+1-800-555-0100",
                "https://novacorp.com",
                null // should default to ACTIVE
        );

        AccountResponse response = accountService.createAccount(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("Nova Corp Industries");
        assertThat(response.domain()).isEqualTo("novacorp.com");
        assertThat(response.industry()).isEqualTo("Manufacturing");
        assertThat(response.status()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(response.contactCount()).isZero();
        assertThat(response.createdAt()).isNotNull();
        assertThat(response.updatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Verify Account update and retrieve by ID")
    void testGetAndUpdateAccount() {
        AccountResponse created = accountService.createAccount(new CreateAccountRequest(
                "Initial Name", "initial.com", "Tech", null, null, AccountStatus.PROSPECT
        ));

        UpdateAccountRequest updateRequest = new UpdateAccountRequest(
                "Updated Name", "updated.com", "BioTech", "+1-555-9999", "https://updated.com", AccountStatus.ACTIVE
        );

        AccountResponse updated = accountService.updateAccount(created.id(), updateRequest);
        assertThat(updated.name()).isEqualTo("Updated Name");
        assertThat(updated.domain()).isEqualTo("updated.com");
        assertThat(updated.status()).isEqualTo(AccountStatus.ACTIVE);

        AccountResponse retrieved = accountService.getAccountById(created.id());
        assertThat(retrieved.name()).isEqualTo("Updated Name");
    }

    @Test
    @DisplayName("Verify Account lookup throws ResourceNotFoundException for unknown ID")
    void testGetNonexistentAccountThrowsNotFound() {
        assertThatThrownBy(() -> accountService.getAccountById(999999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Account with identifier '999999' was not found");
    }

    @Test
    @DisplayName("Verify Contact creation associated with an existing Account")
    void testCreateContactWithAccount() {
        AccountResponse account = accountService.createAccount(new CreateAccountRequest(
                "Sovereign Defense", "sovereign.io", "Defense", null, null, AccountStatus.ACTIVE
        ));

        CreateContactRequest request = new CreateContactRequest(
                "John",
                "Connor",
                "john.connor@sovereign.io",
                "555-0123",
                "Tactical Lead",
                ContactStatus.CUSTOMER,
                "VIP contact",
                account.id()
        );

        ContactResponse response = contactService.createContact(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.firstName()).isEqualTo("John");
        assertThat(response.lastName()).isEqualTo("Connor");
        assertThat(response.email()).isEqualTo("john.connor@sovereign.io");
        assertThat(response.status()).isEqualTo(ContactStatus.CUSTOMER);
        assertThat(response.account()).isNotNull();
        assertThat(response.account().id()).isEqualTo(account.id());
        assertThat(response.account().name()).isEqualTo("Sovereign Defense");
        assertThat(response.account().domain()).isEqualTo("sovereign.io");
    }

    @Test
    @DisplayName("Verify standalone Contact creation without an Account")
    void testCreateStandaloneContact() {
        CreateContactRequest request = new CreateContactRequest(
                "Marcus",
                "Wright",
                "marcus@independent.net",
                null,
                "Infiltrator",
                null, // defaults to LEAD
                null,
                null
        );

        ContactResponse response = contactService.createContact(request);

        assertThat(response.id()).isNotNull();
        assertThat(response.firstName()).isEqualTo("Marcus");
        assertThat(response.status()).isEqualTo(ContactStatus.LEAD);
        assertThat(response.account()).isNull();
    }

    @Test
    @DisplayName("Verify Contact creation with non-existent Account ID throws ResourceNotFoundException")
    void testCreateContactWithMissingAccountThrowsNotFound() {
        CreateContactRequest request = new CreateContactRequest(
                "Invalid",
                "Reference",
                "invalid@nowhere.com",
                null,
                null,
                ContactStatus.LEAD,
                null,
                888888L
        );

        assertThatThrownBy(() -> contactService.createContact(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Account with identifier '888888' was not found");
    }

    @Test
    @DisplayName("Verify Contact update: modifying fields, re-assigning account, and disassociating account")
    void testUpdateContactLifecycle() {
        AccountResponse account1 = accountService.createAccount(new CreateAccountRequest("Corp One", "one.com", null, null, null, AccountStatus.ACTIVE));
        AccountResponse account2 = accountService.createAccount(new CreateAccountRequest("Corp Two", "two.com", null, null, null, AccountStatus.ACTIVE));

        ContactResponse contact = contactService.createContact(new CreateContactRequest(
                "Kate", "Brewster", "kate@one.com", null, null, ContactStatus.PROSPECT, null, account1.id()
        ));
        assertThat(contact.account().id()).isEqualTo(account1.id());

        // 1. Reassign to account 2
        UpdateContactRequest reassign = new UpdateContactRequest(
                "Katherine", "Brewster", "kate@two.com", "555-2222", "Director", ContactStatus.CUSTOMER, "Promoted", account2.id()
        );
        ContactResponse reassigned = contactService.updateContact(contact.id(), reassign);
        assertThat(reassigned.firstName()).isEqualTo("Katherine");
        assertThat(reassigned.account().id()).isEqualTo(account2.id());

        // 2. Disassociate account (set to null)
        UpdateContactRequest disassociate = new UpdateContactRequest(
                "Katherine", "Brewster", "kate@personal.org", null, null, ContactStatus.CHURNED, null, null
        );
        ContactResponse disassociated = contactService.updateContact(contact.id(), disassociate);
        assertThat(disassociated.account()).isNull();
        assertThat(disassociated.status()).isEqualTo(ContactStatus.CHURNED);
    }

    @Test
    @DisplayName("Verify Contact deletion and subsequent get throws ResourceNotFoundException")
    void testDeleteContact() {
        ContactResponse contact = contactService.createContact(new CreateContactRequest(
                "Ephemeral", "User", "ephemeral@temp.org", null, null, ContactStatus.LEAD, null, null
        ));

        contactService.deleteContact(contact.id());

        assertThatThrownBy(() -> contactService.getContactById(contact.id()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Verify duplicate email addresses are permitted by domain specification")
    void testDuplicateEmailsAllowed() {
        CreateContactRequest first = new CreateContactRequest("Alice", "Smith", "shared@workplace.com", null, null, ContactStatus.LEAD, null, null);
        CreateContactRequest second = new CreateContactRequest("Bob", "Jones", "shared@workplace.com", null, null, ContactStatus.PROSPECT, null, null);

        ContactResponse r1 = contactService.createContact(first);
        ContactResponse r2 = contactService.createContact(second);

        assertThat(r1.id()).isNotNull();
        assertThat(r2.id()).isNotNull();
        assertThat(r1.id()).isNotEqualTo(r2.id());
        assertThat(r1.email()).isEqualTo(r2.email());
    }

    @Test
    @DisplayName("Verify paginated search and composable filters on ContactService")
    void testListContactsFiltersAndPagination() {
        AccountResponse acct = accountService.createAccount(new CreateAccountRequest("Nexus Group", "nexus.com", "AI", null, null, AccountStatus.ACTIVE));

        contactService.createContact(new CreateContactRequest("Roy", "Batty", "roy@nexus.com", "555-0100", "Combat Specialist", ContactStatus.CUSTOMER, null, acct.id()));
        contactService.createContact(new CreateContactRequest("Pris", "Stratton", "pris@nexus.com", "555-0101", "Model", ContactStatus.CUSTOMER, null, acct.id()));
        contactService.createContact(new CreateContactRequest("Leon", "Kowalski", "leon@nexus.com", "555-0102", "Loader", ContactStatus.LEAD, null, acct.id()));
        contactService.createContact(new CreateContactRequest("Eldon", "Tyrell", "eldon@tyrell.corp", "555-0999", "Founder", ContactStatus.CUSTOMER, null, null));

        // 1. Filter by Status
        PageResponse<ContactResponse> customers = contactService.listContacts(null, ContactStatus.CUSTOMER, null, null, PageRequest.of(0, 10));
        assertThat(customers.content()).hasSize(3);

        // 2. Filter by Account
        PageResponse<ContactResponse> acctContacts = contactService.listContacts(null, null, acct.id(), null, PageRequest.of(0, 10));
        assertThat(acctContacts.content()).hasSize(3);

        // 3. Filter without Account
        PageResponse<ContactResponse> standalone = contactService.listContacts(null, null, null, true, PageRequest.of(0, 10));
        assertThat(standalone.content()).hasSize(1);
        assertThat(standalone.content().get(0).firstName()).isEqualTo("Eldon");

        // 4. Combined keyword search + status
        PageResponse<ContactResponse> search = contactService.listContacts("batty", ContactStatus.CUSTOMER, null, null, PageRequest.of(0, 10));
        assertThat(search.content()).hasSize(1);
        assertThat(search.content().get(0).lastName()).isEqualTo("Batty");

        // 5. Pagination
        PageResponse<ContactResponse> paged = contactService.listContacts(null, null, null, null, PageRequest.of(0, 2, Sort.by("lastName").ascending()));
        assertThat(paged.content()).hasSize(2);
        assertThat(paged.page()).isZero();
        assertThat(paged.size()).isEqualTo(2);
        assertThat(paged.totalElements()).isEqualTo(4);
        assertThat(paged.totalPages()).isEqualTo(2);
    }

    @Test
    @DisplayName("Verify Jakarta Bean Validation rules on Contact and Account DTOs")
    void testBeanValidationRules() {
        // Contact DTO validations
        CreateContactRequest blankFirstName = new CreateContactRequest("", "ValidLast", "test@example.com", null, null, null, null, null);
        Set<ConstraintViolation<CreateContactRequest>> v1 = validator.validate(blankFirstName);
        assertThat(v1).anyMatch(v -> v.getPropertyPath().toString().equals("firstName"));

        CreateContactRequest blankLastName = new CreateContactRequest("ValidFirst", "  ", "test@example.com", null, null, null, null, null);
        Set<ConstraintViolation<CreateContactRequest>> v2 = validator.validate(blankLastName);
        assertThat(v2).anyMatch(v -> v.getPropertyPath().toString().equals("lastName"));

        CreateContactRequest invalidEmail = new CreateContactRequest("First", "Last", "not-a-valid-email", null, null, null, null, null);
        Set<ConstraintViolation<CreateContactRequest>> v3 = validator.validate(invalidEmail);
        assertThat(v3).anyMatch(v -> v.getPropertyPath().toString().equals("email"));

        CreateContactRequest oversizedName = new CreateContactRequest("A".repeat(81), "Last", "test@example.com", null, null, null, null, null);
        Set<ConstraintViolation<CreateContactRequest>> v4 = validator.validate(oversizedName);
        assertThat(v4).anyMatch(v -> v.getPropertyPath().toString().equals("firstName"));

        // Account DTO validations
        CreateAccountRequest blankAccountName = new CreateAccountRequest("   ", "domain.com", null, null, null, null);
        Set<ConstraintViolation<CreateAccountRequest>> v5 = validator.validate(blankAccountName);
        assertThat(v5).anyMatch(v -> v.getPropertyPath().toString().equals("name"));
    }
}

