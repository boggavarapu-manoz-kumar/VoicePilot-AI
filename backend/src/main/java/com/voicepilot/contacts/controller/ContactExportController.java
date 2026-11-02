package com.voicepilot.contacts.controller;

import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.service.exporting.ContactExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * REST controller providing streaming CSV export of CRM contacts.
 */
@RestController
@RequestMapping("/contacts/export")
@Tag(name = "Contact Export", description = "Endpoints for exporting CRM contacts to CSV format")
public class ContactExportController {

    private final ContactExportService exportService;

    public ContactExportController(ContactExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping
    @Operation(summary = "Export contacts to CSV", description = "Streams a UTF-8 RFC 4180 CSV export of contacts matching the provided filters or explicit selection.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "CSV export stream initiated")
    })
    public ResponseEntity<StreamingResponseBody> exportContactsCsv(
            @Parameter(description = "Optional search query")
            @RequestParam(required = false) String search,

            @Parameter(description = "Filter by status")
            @RequestParam(required = false) ContactStatus status,

            @Parameter(description = "Filter by account ID")
            @RequestParam(required = false) Long accountId,

            @Parameter(description = "Filter unassigned contacts only")
            @RequestParam(required = false) Boolean withoutAccount,

            @Parameter(description = "Optional list of specific contact IDs to export")
            @RequestParam(required = false) List<Long> ids
    ) {
        String filename = "contacts_export_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        StreamingResponseBody responseBody = outputStream -> {
            exportService.exportContactsCsv(search, status, accountId, withoutAccount, ids, outputStream);
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .header("X-Content-Type-Options", "nosniff")
                .body(responseBody);
    }
}

