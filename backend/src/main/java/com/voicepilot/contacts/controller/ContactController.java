package com.voicepilot.contacts.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.common.api.PageResponse;
import com.voicepilot.contacts.dto.ContactResponse;
import com.voicepilot.contacts.dto.CreateContactRequest;
import com.voicepilot.contacts.dto.UpdateContactRequest;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

/**
 * REST controller for CRM Contact resource management.
 * Context path /api/v1 is set at the application level; paths here are relative to that root.
 */
@RestController
@RequestMapping("/contacts")
@Tag(name = "Contacts", description = "CRM Contact management endpoints")
public class ContactController {

    private static final int MAX_PAGE_SIZE = 100;
    private static final String DEFAULT_SORT_FIELD = "lastName";

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = Objects.requireNonNull(contactService, "contactService must not be null");
    }

    // -------------------------------------------------------------------------
    // GET /contacts
    // -------------------------------------------------------------------------

    @GetMapping
    @Operation(
            summary = "List contacts",
            description = "Returns a paginated list of CRM contacts. Supports search, status, and account filtering."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contacts retrieved successfully")
    })
    public ResponseEntity<ApiResponse<PageResponse<ContactResponse>>> listContacts(
            @Parameter(description = "Optional search term matched against first name, last name, email, and phone")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by contact status (LEAD, PROSPECT, CUSTOMER, CHURNED)")
            @RequestParam(required = false) ContactStatus status,

            @Parameter(description = "Filter contacts belonging to a specific account ID")
            @RequestParam(required = false) Long accountId,

            @Parameter(description = "When true, returns only unlinked contacts (no account association)")
            @RequestParam(required = false) Boolean withoutAccount,

            @Parameter(description = "Zero-based page number", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Number of results per page (1–100)", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Field to sort by", example = "lastName")
            @RequestParam(defaultValue = DEFAULT_SORT_FIELD) String sort,

            @Parameter(description = "Sort direction: asc or desc", example = "asc")
            @RequestParam(defaultValue = "asc") String direction
    ) {
        int boundedSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, boundedSize, Sort.by(sortDirection, resolveContactSortField(sort)));

        PageResponse<ContactResponse> result = contactService.listContacts(search, status, accountId, withoutAccount, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -------------------------------------------------------------------------
    // POST /contacts
    // -------------------------------------------------------------------------

    @PostMapping
    @Operation(summary = "Create contact", description = "Creates a new CRM contact.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Contact created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Referenced account not found")
    })
    public ResponseEntity<ApiResponse<ContactResponse>> createContact(
            @Valid @RequestBody CreateContactRequest request
    ) {
        ContactResponse created = contactService.createContact(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Contact created successfully"));
    }

    // -------------------------------------------------------------------------
    // GET /contacts/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    @Operation(summary = "Get contact by ID", description = "Retrieves a single CRM contact by its identifier.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contact found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Contact not found")
    })
    public ResponseEntity<ApiResponse<ContactResponse>> getContact(
            @Parameter(description = "Contact ID") @PathVariable Long id
    ) {
        ContactResponse contact = contactService.getContactById(id);
        return ResponseEntity.ok(ApiResponse.ok(contact));
    }

    // -------------------------------------------------------------------------
    // PUT /contacts/{id}
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    @Operation(summary = "Update contact", description = "Updates an existing CRM contact.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contact updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Contact or referenced account not found")
    })
    public ResponseEntity<ApiResponse<ContactResponse>> updateContact(
            @Parameter(description = "Contact ID") @PathVariable Long id,
            @Valid @RequestBody UpdateContactRequest request
    ) {
        ContactResponse updated = contactService.updateContact(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Contact updated successfully"));
    }

    // -------------------------------------------------------------------------
    // DELETE /contacts/{id}
    // -------------------------------------------------------------------------

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete contact", description = "Permanently deletes a CRM contact by its identifier.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Contact deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Contact not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteContact(
            @Parameter(description = "Contact ID") @PathVariable Long id
    ) {
        contactService.deleteContact(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Contact deleted successfully"));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static String resolveContactSortField(String requested) {
        return switch (requested) {
            case "firstName" -> "firstName";
            case "email" -> "email";
            case "status" -> "status";
            case "createdAt" -> "createdAt";
            default -> DEFAULT_SORT_FIELD;
        };
    }
}

