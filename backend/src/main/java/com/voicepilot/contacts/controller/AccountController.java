package com.voicepilot.contacts.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.common.api.PageResponse;
import com.voicepilot.contacts.dto.AccountResponse;
import com.voicepilot.contacts.dto.CreateAccountRequest;
import com.voicepilot.contacts.dto.UpdateAccountRequest;
import com.voicepilot.contacts.model.AccountStatus;
import com.voicepilot.contacts.service.AccountService;
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
 * REST controller for CRM Account resource management.
 * Context path /api/v1 is set at the application level; paths here are relative to that root.
 */
@RestController
@RequestMapping("/accounts")
@Tag(name = "Accounts", description = "CRM Account management endpoints")
public class AccountController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;
    private static final String DEFAULT_SORT_FIELD = "name";

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = Objects.requireNonNull(accountService, "accountService must not be null");
    }

    // -------------------------------------------------------------------------
    // GET /accounts
    // -------------------------------------------------------------------------

    @GetMapping
    @Operation(
            summary = "List accounts",
            description = "Returns a paginated list of CRM accounts. Supports optional full-text search and status filtering."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Accounts retrieved successfully")
    })
    public ResponseEntity<ApiResponse<PageResponse<AccountResponse>>> listAccounts(
            @Parameter(description = "Optional search term matched against account name, domain, and industry")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by account status (ACTIVE, INACTIVE, PROSPECT)")
            @RequestParam(required = false) AccountStatus status,

            @Parameter(description = "Zero-based page number", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Number of results per page (1–100)", example = "20")
            @RequestParam(defaultValue = "20") int size,

            @Parameter(description = "Field to sort by", example = "name")
            @RequestParam(defaultValue = DEFAULT_SORT_FIELD) String sort
    ) {
        int boundedSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Pageable pageable = PageRequest.of(page, boundedSize, Sort.by(Sort.Direction.ASC, resolveAccountSortField(sort)));

        PageResponse<AccountResponse> result = accountService.listAccounts(search, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // -------------------------------------------------------------------------
    // POST /accounts
    // -------------------------------------------------------------------------

    @PostMapping
    @Operation(summary = "Create account", description = "Creates a new CRM account.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Account created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed")
    })
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @Valid @RequestBody CreateAccountRequest request
    ) {
        AccountResponse created = accountService.createAccount(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Account created successfully"));
    }

    // -------------------------------------------------------------------------
    // GET /accounts/{id}
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    @Operation(summary = "Get account by ID", description = "Retrieves a single CRM account by its identifier.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<ApiResponse<AccountResponse>> getAccount(
            @Parameter(description = "Account ID") @PathVariable Long id
    ) {
        AccountResponse account = accountService.getAccountById(id);
        return ResponseEntity.ok(ApiResponse.ok(account));
    }

    // -------------------------------------------------------------------------
    // PUT /accounts/{id}
    // -------------------------------------------------------------------------

    @PutMapping("/{id}")
    @Operation(summary = "Update account", description = "Updates an existing CRM account.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Account not found")
    })
    public ResponseEntity<ApiResponse<AccountResponse>> updateAccount(
            @Parameter(description = "Account ID") @PathVariable Long id,
            @Valid @RequestBody UpdateAccountRequest request
    ) {
        AccountResponse updated = accountService.updateAccount(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Account updated successfully"));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static String resolveAccountSortField(String requested) {
        return switch (requested) {
            case "domain" -> "domain";
            case "industry" -> "industry";
            case "status" -> "status";
            case "createdAt" -> "createdAt";
            default -> DEFAULT_SORT_FIELD;
        };
    }
}

