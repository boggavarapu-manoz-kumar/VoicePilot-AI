package com.voicepilot.contacts.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.common.api.PageResponse;
import com.voicepilot.contacts.dto.ContactResponse;
import com.voicepilot.contacts.dto.CreateSegmentRequest;
import com.voicepilot.contacts.dto.SegmentFilterCriteria;
import com.voicepilot.contacts.dto.SegmentResponse;
import com.voicepilot.contacts.dto.UpdateSegmentRequest;
import com.voicepilot.contacts.service.SegmentService;
import com.voicepilot.contacts.service.exporting.ContactExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
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
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * REST controller for CRM Contact Segmentation & Saved Views.
 * Context path /api/v1 is set at the application level; paths here are relative.
 */
@RestController
@RequestMapping("/segments")
@Tag(name = "Segments", description = "CRM Contact Segmentation and Saved Views endpoints")
public class SegmentController {

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final SegmentService segmentService;
    private final ContactExportService exportService;

    public SegmentController(SegmentService segmentService, ContactExportService exportService) {
        this.segmentService = Objects.requireNonNull(segmentService, "segmentService must not be null");
        this.exportService = Objects.requireNonNull(exportService, "exportService must not be null");
    }

    @PostMapping
    @Operation(summary = "Create saved segment", description = "Persists a new named filter definition.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Segment created"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Segment name conflict")
    })
    public ResponseEntity<ApiResponse<SegmentResponse>> createSegment(@Valid @RequestBody CreateSegmentRequest request) {
        SegmentResponse created = segmentService.createSegment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created, "Segment created successfully"));
    }

    @GetMapping
    @Operation(summary = "List saved segments", description = "Returns a paginated list of saved segments with matching contact counts.")
    public ResponseEntity<ApiResponse<PageResponse<SegmentResponse>>> listSegments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int boundedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int boundedPage = Math.max(0, page);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.ASC, "name"));
        PageResponse<SegmentResponse> result = segmentService.listSegments(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get segment details", description = "Retrieves segment definition and matching contact count.")
    public ResponseEntity<ApiResponse<SegmentResponse>> getSegmentById(@PathVariable Long id) {
        SegmentResponse response = segmentService.getSegmentById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update segment", description = "Updates an existing segment's name, description, and filter criteria.")
    public ResponseEntity<ApiResponse<SegmentResponse>> updateSegment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSegmentRequest request
    ) {
        SegmentResponse updated = segmentService.updateSegment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Segment updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete segment", description = "Deletes a saved segment. Does not alter contacts.")
    public ResponseEntity<ApiResponse<Void>> deleteSegment(@PathVariable Long id) {
        segmentService.deleteSegment(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Segment deleted successfully"));
    }

    @GetMapping("/{id}/contacts")
    @Operation(summary = "Get matching contacts", description = "Returns paginated contacts matching the segment's filter criteria.")
    public ResponseEntity<ApiResponse<PageResponse<ContactResponse>>> getSegmentContacts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        int boundedSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        int boundedPage = Math.max(0, page);
        Pageable pageable = PageRequest.of(boundedPage, boundedSize, Sort.by(Sort.Direction.ASC, "lastName", "firstName"));
        PageResponse<ContactResponse> contacts = segmentService.getSegmentContacts(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(contacts));
    }

    @GetMapping("/{id}/export")
    @Operation(summary = "Export segment contacts to CSV", description = "Streams a CSV export of all contacts matching the segment.")
    public ResponseEntity<StreamingResponseBody> exportSegmentContacts(@PathVariable Long id) {
        SegmentResponse segment = segmentService.getSegmentById(id);
        SegmentFilterCriteria criteria = segment.filterCriteria();

        String safeName = segment.name().replaceAll("[^a-zA-Z0-9_-]", "_");
        String filename = "segment_" + safeName + "_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";

        StreamingResponseBody responseBody = outputStream -> {
            exportService.exportContactsCsv(
                    criteria != null ? criteria.search() : null,
                    criteria != null ? criteria.status() : null,
                    criteria != null ? criteria.accountId() : null,
                    criteria != null ? criteria.withoutAccount() : null,
                    null,
                    outputStream
            );
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/csv; charset=UTF-8")
                .header("X-Content-Type-Options", "nosniff")
                .body(responseBody);
    }
}

