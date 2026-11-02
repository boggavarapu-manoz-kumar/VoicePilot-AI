package com.voicepilot.contacts.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.contacts.dto.importing.ImportExecutionRequest;
import com.voicepilot.contacts.dto.importing.ImportPreviewResponse;
import com.voicepilot.contacts.dto.importing.ImportResultReport;
import com.voicepilot.contacts.service.importing.ContactImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST controller for transactional Contact CSV import workflow.
 */
@RestController
@RequestMapping("/contacts/import")
@Tag(name = "Contact Import API", description = "Endpoints for previewing and executing CSV contact imports")
public class ContactImportController {

    private final ContactImportService contactImportService;

    public ContactImportController(ContactImportService contactImportService) {
        this.contactImportService = contactImportService;
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Preview CSV contact import", description = "Parses, validates, maps columns, and checks duplicate candidates in dry-run mode with zero database writes.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Preview generated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid CSV format or missing required columns")
    })
    public ResponseEntity<ApiResponse<ImportPreviewResponse>> previewImport(
            @Parameter(description = "CSV file to import", required = true)
            @RequestParam("file") MultipartFile file,
            @Parameter(description = "Optional custom header column mappings", required = false)
            @RequestParam(value = "overrides", required = false) Map<String, String> overrides
    ) {
        ImportPreviewResponse preview = contactImportService.previewImport(file, overrides);
        return ResponseEntity.ok(ApiResponse.ok(preview, "CSV preview generated successfully"));
    }

    @PostMapping("/execute")
    @Operation(summary = "Execute confirmed contact import", description = "Executes the validated import within an atomic transaction applying chosen duplicate policy.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Import executed successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Import session expired or not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Session already executed or rejected under duplicate policy")
    })
    public ResponseEntity<ApiResponse<ImportResultReport>> executeImport(
            @Valid @RequestBody ImportExecutionRequest request
    ) {
        ImportResultReport report = contactImportService.executeImport(request);
        return ResponseEntity.ok(ApiResponse.ok(report, "Import executed successfully"));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Cancel import session", description = "Cancels active in-memory import session without creating or altering contacts.")
    public ResponseEntity<ApiResponse<Void>> cancelSession(
            @PathVariable("sessionId") String sessionId
    ) {
        contactImportService.cancelSession(sessionId);
        return ResponseEntity.ok(ApiResponse.ok(null, "Import session cancelled successfully"));
    }
}

