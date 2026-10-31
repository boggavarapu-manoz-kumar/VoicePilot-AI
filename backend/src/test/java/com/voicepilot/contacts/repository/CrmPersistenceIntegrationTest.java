package com.voicepilot.contacts.repository;

import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.AccountStatus;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class CrmPersistenceIntegrationTest {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    @DisplayName("Verify Account persistence, lifecycle callbacks, and non-null audit timestamps")
    void testAccountPersistenceAndTimestamps() {
        Account account = new Account("Apex Robotics Inc", "apexrobotics.com", "Robotics", "+1-555-0199", "https://apexrobotics.com", AccountStatus.ACTIVE);
        Account saved = accountRepository.save(account);

        entityManager.flush();
        entityManager.clear();

        Account reloaded = accountRepository.findById(saved.getId()).orElseThrow();
        assertThat(reloaded.getId()).isNotNull();
        assertThat(reloaded.getName()).isEqualTo("Apex Robotics Inc");
        assertThat(reloaded.getDomain()).isEqualTo("apexrobotics.com");
        assertThat(reloaded.getStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(reloaded.getCreatedAt()).isNotNull();
        assertThat(reloaded.getUpdatedAt()).isNotNull();

        Instant initialUpdate = reloaded.getUpdatedAt();
        reloaded.setPhone("+1-555-0200");
        accountRepository.save(reloaded);

        entityManager.flush();
        entityManager.clear();

        Account updated = accountRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getPhone()).isEqualTo("+1-555-0200");
        assertThat(updated.getUpdatedAt()).isNotNull();
        assertThat(updated.getUpdatedAt()).isAfterOrEqualTo(initialUpdate);
    }

    @Test
    @DisplayName("Verify Contact persistence with and without an Account association")
    void testContactPersistenceWithAndWithoutAccount() {
        Account account = accountRepository.save(new Account("Cyberdyne Systems", "cyberdyne.io", "Defense AI", "555-4000", "https://cyberdyne.io", AccountStatus.PROSPECT));

        // Contact associated with Account
        Contact contactWithAccount = new Contact("Miles", "Dyson", "miles.dyson@cyberdyne.io", "555-4001", "Director of Systems", ContactStatus.PROSPECT, "Key decision maker", account);
        Contact savedWithAccount = contactRepository.save(contactWithAccount);

        // Contact independent of Account
        Contact standaloneContact = new Contact("Sarah", "Connor", "sarah@resistance.org", "555-9000", "Independent Specialist", ContactStatus.LEAD, "Field contact", null);
        Contact savedStandalone = contactRepository.save(standaloneContact);

        entityManager.flush();
        entityManager.clear();

        Contact reloadedWithAccount = contactRepository.findById(savedWithAccount.getId()).orElseThrow();
        assertThat(reloadedWithAccount.getAccount()).isNotNull();
        assertThat(reloadedWithAccount.getAccountId()).isEqualTo(account.getId());
        assertThat(reloadedWithAccount.getAccount().getName()).isEqualTo("Cyberdyne Systems");

        Contact reloadedStandalone = contactRepository.findById(savedStandalone.getId()).orElseThrow();
        assertThat(reloadedStandalone.getAccount()).isNull();
        assertThat(reloadedStandalone.getAccountId()).isNull();
        assertThat(reloadedStandalone.getEmail()).isEqualTo("sarah@resistance.org");
    }

    @Test
    @DisplayName("Verify Enum values are persisted as Strings in the database columns, not ordinals")
    void testEnumPersistenceAsString() {
        Account account = accountRepository.save(new Account("Stratus Cloud", "stratus.net", "Cloud", "555-7777", null, AccountStatus.PROSPECT));
        Contact contact = contactRepository.save(new Contact("David", "Bowman", "david@stratus.net", "555-7778", "Pilot", ContactStatus.CHURNED, null, account));

        entityManager.flush();

        // Native SQL verification to assert raw database column contains string text, not integer ordinals
        Object rawAccountStatus = entityManager.createNativeQuery("SELECT status FROM crm_accounts WHERE id = :id")
                .setParameter("id", account.getId())
                .getSingleResult();
        assertThat(rawAccountStatus).isEqualTo("PROSPECT");

        Object rawContactStatus = entityManager.createNativeQuery("SELECT status FROM crm_contacts WHERE id = :id")
                .setParameter("id", contact.getId())
                .getSingleResult();
        assertThat(rawContactStatus).isEqualTo("CHURNED");
    }

    @Test
    @DisplayName("Verify AccountRepository search, domain lookup, and status pagination")
    void testAccountRepositoryQueries() {
        accountRepository.save(new Account("Acro Dynamics", "acro.io", "Aerospace", null, null, AccountStatus.ACTIVE));
        accountRepository.save(new Account("Acro Logistics", "acrologistics.com", "Supply Chain", null, null, AccountStatus.INACTIVE));
        accountRepository.save(new Account("Helios Energy", "helios.org", "Energy", null, null, AccountStatus.ACTIVE));

        entityManager.flush();
        entityManager.clear();

        // Name search
        Page<Account> acroResults = accountRepository.findByNameContainingIgnoreCase("acro", PageRequest.of(0, 10));
        assertThat(acroResults.getContent()).hasSize(2);

        // Domain lookup
        Optional<Account> byDomain = accountRepository.findByDomainIgnoreCase("acro.io");
        assertThat(byDomain).isPresent();
        assertThat(byDomain.get().getName()).isEqualTo("Acro Dynamics");

        // Status filter
        Page<Account> activeAccounts = accountRepository.findByStatus(AccountStatus.ACTIVE, PageRequest.of(0, 10));
        assertThat(activeAccounts.getContent()).allMatch(a -> a.getStatus() == AccountStatus.ACTIVE);
    }

    @Test
    @DisplayName("Verify ContactRepository query methods: email, phone, status, and account filtering")
    void testContactRepositoryQueries() {
        Account account = accountRepository.save(new Account("Omni Consumer Products", "ocp.corp", "Conglomerate", null, null, AccountStatus.ACTIVE));

        contactRepository.save(new Contact("Alex", "Murphy", "alex.murphy@ocp.corp", "555-0101", "Lead Officer", ContactStatus.CUSTOMER, null, account));
        contactRepository.save(new Contact("Anne", "Lewis", "anne.lewis@ocp.corp", "555-0102", "Senior Partner", ContactStatus.CUSTOMER, null, account));
        contactRepository.save(new Contact("Richard", "Jones", "dick.jones@ocp.corp", "555-0199", "VP", ContactStatus.CHURNED, null, account));
        contactRepository.save(new Contact("Clarence", "Boddicker", "clarence@freemail.com", "555-0666", "Contractor", ContactStatus.LEAD, null, null));

        entityManager.flush();
        entityManager.clear();

        // Email lookup
        Optional<Contact> byEmail = contactRepository.findByEmailIgnoreCase("ALEX.MURPHY@OCP.CORP");
        assertThat(byEmail).isPresent();
        assertThat(byEmail.get().getFirstName()).isEqualTo("Alex");

        // Phone lookup
        List<Contact> byPhone = contactRepository.findByPhone("555-0102");
        assertThat(byPhone).hasSize(1);
        assertThat(byPhone.get(0).getLastName()).isEqualTo("Lewis");

        // Status filtering
        Page<Contact> customers = contactRepository.findByStatus(ContactStatus.CUSTOMER, PageRequest.of(0, 10));
        assertThat(customers.getContent()).hasSize(2);

        // Account filtering
        Page<Contact> ocpContacts = contactRepository.findByAccountId(account.getId(), PageRequest.of(0, 10));
        assertThat(ocpContacts.getContent()).hasSize(3);
        assertThat(contactRepository.countByAccountId(account.getId())).isEqualTo(3);

        // Name search (first or last)
        Page<Contact> nameSearch = contactRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase("alex", "alex", PageRequest.of(0, 10));
        assertThat(nameSearch.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Verify composable Spring Data JPA Specifications for complex filtering")
    void testComposableSpecifications() {
        Account accountA = accountRepository.save(new Account("Vanguard Holdings", "vanguard.com", "Finance", null, null, AccountStatus.ACTIVE));
        Account accountB = accountRepository.save(new Account("Starlight Media", "starlight.io", "Entertainment", null, null, AccountStatus.ACTIVE));

        contactRepository.save(new Contact("Evelyn", "Cross", "evelyn@vanguard.com", "+1-415-0001", "Partner", ContactStatus.CUSTOMER, null, accountA));
        contactRepository.save(new Contact("Liam", "Cross", "liam@vanguard.com", "+1-415-0002", "Analyst", ContactStatus.PROSPECT, null, accountA));
        contactRepository.save(new Contact("Chloe", "Zhao", "chloe@starlight.io", "+1-212-0001", "Director", ContactStatus.CUSTOMER, null, accountB));
        contactRepository.save(new Contact("Noah", "Vale", "noah@independent.org", "+1-312-0001", "Consultant", ContactStatus.LEAD, null, null));

        entityManager.flush();
        entityManager.clear();

        // 1. Search term alone (cross-field matching)
        Specification<Contact> searchSpec = ContactSpecifications.withSearchTerm("cross");
        List<Contact> crossResults = contactRepository.findAll(searchSpec);
        assertThat(crossResults).hasSize(2);

        // 2. Combined specification: Status CUSTOMER AND Account Vanguard
        Specification<Contact> combinedSpec = Specification.where(ContactSpecifications.withStatus(ContactStatus.CUSTOMER))
                .and(ContactSpecifications.withAccountId(accountA.getId()));
        List<Contact> vanguardCustomers = contactRepository.findAll(combinedSpec);
        assertThat(vanguardCustomers).hasSize(1);
        assertThat(vanguardCustomers.get(0).getEmail()).isEqualTo("evelyn@vanguard.com");

        // 3. Standalone contacts (without account)
        Specification<Contact> standaloneSpec = ContactSpecifications.withoutAccount();
        List<Contact> standaloneResults = contactRepository.findAll(standaloneSpec);
        assertThat(standaloneResults).hasSize(1);
        assertThat(standaloneResults.get(0).getFirstName()).isEqualTo("Noah");
    }

    @Test
    @DisplayName("Verify pagination and deterministic sorting on CRM contacts")
    void testPaginationAndSorting() {
        for (int i = 1; i <= 7; i++) {
            contactRepository.save(new Contact("User" + i, "Batch" + String.format("%02d", i), "user" + i + "@batch.com"));
        }

        entityManager.flush();
        entityManager.clear();

        PageRequest pageRequest = PageRequest.of(0, 3, Sort.by("lastName").ascending());
        Page<Contact> firstPage = contactRepository.findAll(pageRequest);

        assertThat(firstPage.getContent()).hasSize(3);
        assertThat(firstPage.getTotalElements()).isGreaterThanOrEqualTo(7);
        assertThat(firstPage.getTotalPages()).isGreaterThanOrEqualTo(3);
        assertThat(firstPage.getContent().get(0).getLastName()).isEqualTo("Batch01");
        assertThat(firstPage.getContent().get(1).getLastName()).isEqualTo("Batch02");
        assertThat(firstPage.getContent().get(2).getLastName()).isEqualTo("Batch03");
    }

    @Test
    @DisplayName("Verify entity equality contract based on ID and non-recursive toString")
    void testEntityEqualityAndToString() {
        Account a1 = new Account("Nexus Corp");
        Account a2 = new Account("Nexus Corp");
        // Transient entities without ID are only equal to self
        assertThat(a1).isEqualTo(a1);
        assertThat(a1).isNotEqualTo(a2);

        Account saved = accountRepository.save(new Account("Nexus Corp"));
        Account proxy = accountRepository.getReferenceById(saved.getId());

        assertThat(saved).isEqualTo(proxy);
        assertThat(saved.hashCode()).isEqualTo(proxy.hashCode());

        // Verify non-recursive toString does not throw or traverse lazy collections
        Contact contact = new Contact("Deckard", "Rick", "deckard@nexus.com", null, "Inspector", ContactStatus.PROSPECT, null, saved);
        saved.addContact(contact);

        assertThat(saved.toString()).contains("Nexus Corp");
        assertThat(contact.toString()).contains("Deckard");
    }
}

