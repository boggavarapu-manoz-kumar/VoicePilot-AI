package com.voicepilot.contacts.service;

import com.voicepilot.common.api.PageResponse;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.contacts.dto.ContactResponse;
import com.voicepilot.contacts.dto.CreateContactRequest;
import com.voicepilot.contacts.dto.UpdateContactRequest;
import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.ContactRepository;
import com.voicepilot.contacts.repository.ContactSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Domain application service for managing CRM Contacts.
 * Coordinates entity lifecycle, account association resolution, validation,
 * and composable search/filter execution.
 *
 * Duplicate email addresses are allowed in accordance with the CRM schema specification.
 */
@Service
@Transactional(readOnly = true)
public class ContactService {

    private final ContactRepository contactRepository;
    private final AccountService accountService;

    public ContactService(ContactRepository contactRepository, AccountService accountService) {
        this.contactRepository = Objects.requireNonNull(contactRepository, "contactRepository must not be null");
        this.accountService = Objects.requireNonNull(accountService, "accountService must not be null");
    }

    /**
     * Creates a new Contact, optionally linking to a verified Account entity.
     */
    @Transactional
    public ContactResponse createContact(CreateContactRequest request) {
        Objects.requireNonNull(request, "create request must not be null");

        Account account = null;
        if (request.accountId() != null) {
            account = accountService.findAccountEntityById(request.accountId());
        }

        ContactStatus status = request.status() != null ? request.status() : ContactStatus.LEAD;

        Contact contact = new Contact(
                trimToNull(request.firstName()),
                trimToNull(request.lastName()),
                trimToNull(request.email()),
                trimToNull(request.phone()),
                trimToNull(request.jobTitle()),
                status,
                trimToNull(request.notes()),
                account
        );

        Contact saved = contactRepository.save(contact);
        return ContactResponse.from(saved);
    }

    /**
     * Retrieves a Contact by its synthetic ID or throws ResourceNotFoundException.
     */
    public ContactResponse getContactById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Contact ID must not be null");
        }
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        return ContactResponse.from(contact);
    }

    /**
     * Lists contacts matching composable filter criteria with pagination.
     */
    public PageResponse<ContactResponse> listContacts(String searchTerm,
                                                      ContactStatus status,
                                                      Long accountId,
                                                      Boolean withoutAccount,
                                                      Pageable pageable) {
        Specification<Contact> spec = Specification.where(ContactSpecifications.withSearchTerm(searchTerm))
                .and(ContactSpecifications.withStatus(status));

        if (Boolean.TRUE.equals(withoutAccount)) {
            spec = spec.and(ContactSpecifications.withoutAccount());
        } else if (accountId != null) {
            spec = spec.and(ContactSpecifications.withAccountId(accountId));
        }

        Page<Contact> page = contactRepository.findAll(spec, pageable);
        return PageResponse.from(page, ContactResponse::from);
    }

    /**
     * Updates an existing Contact and re-evaluates account relationship boundaries.
     */
    @Transactional
    public ContactResponse updateContact(Long id, UpdateContactRequest request) {
        if (id == null) {
            throw new IllegalArgumentException("Contact ID must not be null");
        }
        Objects.requireNonNull(request, "update request must not be null");

        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));

        Account account = null;
        if (request.accountId() != null) {
            account = accountService.findAccountEntityById(request.accountId());
        }

        contact.setFirstName(trimToNull(request.firstName()));
        contact.setLastName(trimToNull(request.lastName()));
        contact.setEmail(trimToNull(request.email()));
        contact.setPhone(trimToNull(request.phone()));
        contact.setJobTitle(trimToNull(request.jobTitle()));
        contact.setStatus(request.status());
        contact.setNotes(trimToNull(request.notes()));
        contact.setAccount(account);

        Contact updated = contactRepository.save(contact);
        return ContactResponse.from(updated);
    }

    /**
     * Deletes a Contact by ID or throws ResourceNotFoundException if non-existent.
     */
    @Transactional
    public void deleteContact(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Contact ID must not be null");
        }
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contact", id));
        contactRepository.delete(contact);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

