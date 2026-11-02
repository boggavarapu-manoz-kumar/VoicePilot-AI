package com.voicepilot.contacts.service.importing;

import com.voicepilot.common.exception.ResourceConflictException;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.contacts.dto.importing.DuplicatePolicy;
import com.voicepilot.contacts.dto.importing.ImportErrorDetail;
import com.voicepilot.contacts.dto.importing.ImportExecutionRequest;
import com.voicepilot.contacts.dto.importing.ImportPreviewResponse;
import com.voicepilot.contacts.dto.importing.ImportResultReport;
import com.voicepilot.contacts.dto.importing.ParsedContactRow;
import com.voicepilot.contacts.model.Account;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.AccountRepository;
import com.voicepilot.contacts.repository.ContactRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Enterprise Service orchestrating the two-phase human-in-the-loop Contact CSV import lifecycle.
 */
@Service
public class ContactImportService {

    private static final Logger log = LoggerFactory.getLogger(ContactImportService.class);

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    private final CsvStreamParser csvStreamParser;
    private final ContactColumnMapper columnMapper;
    private final ImportSessionRegistry sessionRegistry;
    private final ContactRepository contactRepository;
    private final AccountRepository accountRepository;

    private final int maxImportRows;

    public ContactImportService(
            CsvStreamParser csvStreamParser,
            ContactColumnMapper columnMapper,
            ImportSessionRegistry sessionRegistry,
            ContactRepository contactRepository,
            AccountRepository accountRepository,
            @Value("${voicepilot.import.max-rows:5000}") int maxImportRows
    ) {
        this.csvStreamParser = csvStreamParser;
        this.columnMapper = columnMapper;
        this.sessionRegistry = sessionRegistry;
        this.contactRepository = contactRepository;
        this.accountRepository = accountRepository;
        this.maxImportRows = maxImportRows;
    }

    /**
     * Phase 1: Uploads and parses CSV in dry-run mode.
     * Computes statistics, maps headers, checks duplicates, validates records.
     * Guarantees zero writes or modifications to the database.
     */
    @Transactional(readOnly = true)
    public ImportPreviewResponse previewImport(MultipartFile file, Map<String, String> userOverrides) {
        sessionRegistry.evictExpired();

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file must not be empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && !originalFilename.toLowerCase(Locale.ROOT).endsWith(".csv")
                && !originalFilename.toLowerCase(Locale.ROOT).endsWith(".txt")) {
            throw new IllegalArgumentException("Only CSV files (.csv or .txt) are accepted");
        }

        List<List<String>> rawRows;
        try (InputStream is = file.getInputStream()) {
            rawRows = csvStreamParser.parse(is, maxImportRows);
        } catch (IOException e) {
            log.error("Failed to read uploaded CSV file stream", e);
            throw new IllegalArgumentException("Failed to parse CSV file: " + e.getMessage());
        }

        if (rawRows.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file contains no data rows");
        }

        List<String> headers = rawRows.get(0);
        if (headers.isEmpty() || headers.stream().allMatch(String::isBlank)) {
            throw new IllegalArgumentException("CSV file contains an empty header row");
        }

        Map<String, String> mappedFields = columnMapper.mapHeaders(headers, userOverrides);

        // Verify required fields are present in header mapping
        if (!mappedFields.containsValue(ContactColumnMapper.FIELD_FIRST_NAME)) {
            throw new IllegalArgumentException("Missing required column for 'First Name' in CSV headers");
        }
        if (!mappedFields.containsValue(ContactColumnMapper.FIELD_LAST_NAME)) {
            throw new IllegalArgumentException("Missing required column for 'Last Name' in CSV headers");
        }
        if (!mappedFields.containsValue(ContactColumnMapper.FIELD_EMAIL)) {
            throw new IllegalArgumentException("Missing required column for 'Email' in CSV headers");
        }

        // Cache existing accounts for rapid in-memory matching during preview
        Map<String, Long> accountNameToId = new HashMap<>();
        Map<String, Long> accountDomainToId = new HashMap<>();
        accountRepository.findAll().forEach(acc -> {
            accountNameToId.put(acc.getName().trim().toLowerCase(Locale.ROOT), acc.getId());
            if (acc.getDomain() != null && !acc.getDomain().isBlank()) {
                accountDomainToId.put(acc.getDomain().trim().toLowerCase(Locale.ROOT), acc.getId());
            }
        });

        List<ParsedContactRow> parsedRows = new ArrayList<>();
        List<ImportErrorDetail> allValidationErrors = new ArrayList<>();
        int validCount = 0;
        int invalidCount = 0;
        int duplicateCount = 0;

        for (int i = 1; i < rawRows.size(); i++) {
            List<String> row = rawRows.get(i);
            int rowNumber = i + 1; // 1-based index (header is row 1)

            ParsedContactRow parsed = parseAndValidateRow(
                    rowNumber,
                    row,
                    headers,
                    mappedFields,
                    accountNameToId,
                    accountDomainToId
            );

            parsedRows.add(parsed);
            if (parsed.valid()) {
                validCount++;
            } else {
                invalidCount++;
                allValidationErrors.addAll(parsed.errors());
            }

            if (parsed.duplicate()) {
                duplicateCount++;
            }
        }

        String sessionId = "imp_" + UUID.randomUUID();
        Instant now = Instant.now();
        Instant expiresAt = now.plus(sessionRegistry.getDefaultTtl());

        ImportSession session = new ImportSession(
                sessionId,
                originalFilename != null ? originalFilename : "contacts.csv",
                headers,
                mappedFields,
                parsedRows,
                now,
                expiresAt,
                false
        );
        sessionRegistry.register(session);

        // Return up to 10 sample rows for UI preview table
        List<ParsedContactRow> sampleRows = parsedRows.stream().limit(10).toList();

        return new ImportPreviewResponse(
                sessionId,
                session.fileName(),
                parsedRows.size(),
                validCount,
                invalidCount,
                duplicateCount,
                headers,
                mappedFields,
                sampleRows,
                allValidationErrors,
                expiresAt
        );
    }

    /**
     * Phase 2: Explicitly executes confirmed import within an atomic transaction.
     */
    @Transactional
    public ImportResultReport executeImport(ImportExecutionRequest request) {
        ImportSession session = sessionRegistry.get(request.sessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Import session not found or has expired. Please re-upload your file."));

        if (session.executed()) {
            throw new ResourceConflictException("This import session has already been executed. Re-upload file to perform a new import.");
        }

        // Lock session against concurrent double-execution
        sessionRegistry.register(session.withExecuted(true));

        long startTime = System.currentTimeMillis();
        DuplicatePolicy policy = request.duplicatePolicy();
        boolean skipInvalid = request.skipInvalidRows();

        List<ParsedContactRow> rows = session.parsedRows();
        List<Long> affectedIds = new ArrayList<>();
        List<ImportErrorDetail> finalErrors = new ArrayList<>();

        int importedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;
        int failedCount = 0;

        // Check if REJECT_ALL policy is triggered by duplicate candidates
        if (policy == DuplicatePolicy.REJECT_ALL) {
            boolean hasDuplicates = rows.stream().anyMatch(ParsedContactRow::duplicate);
            if (hasDuplicates) {
                throw new ResourceConflictException("Import rejected: One or more duplicate contacts detected under REJECT_ALL policy");
            }
        }

        // Check if invalid rows violate skipInvalid policy
        if (!skipInvalid) {
            boolean hasInvalid = rows.stream().anyMatch(r -> !r.valid());
            if (hasInvalid) {
                throw new IllegalArgumentException("Import aborted: CSV contains invalid rows and skipInvalidRows is set to false");
            }
        }

        for (ParsedContactRow row : rows) {
            if (!row.valid()) {
                failedCount++;
                finalErrors.addAll(row.errors());
                continue;
            }

            if (row.duplicate()) {
                if (policy == DuplicatePolicy.SKIP) {
                    skippedCount++;
                    continue;
                } else if (policy == DuplicatePolicy.UPDATE && row.matchedContactId() != null) {
                    Optional<Contact> existingOpt = contactRepository.findById(row.matchedContactId());
                    if (existingOpt.isPresent()) {
                        Contact contact = existingOpt.get();
                        updateContactFromRow(contact, row);
                        contactRepository.save(contact);
                        affectedIds.add(contact.getId());
                        updatedCount++;
                        continue;
                    }
                }
            }

            // Create new contact
            Contact contact = new Contact();
            contact.setFirstName(row.firstName());
            contact.setLastName(row.lastName());
            contact.setEmail(row.email());
            contact.setPhone(row.phone());
            contact.setJobTitle(row.jobTitle());
            contact.setStatus(resolveContactStatus(row.status()));
            contact.setNotes(row.notes());

            if (row.matchedAccountId() != null) {
                accountRepository.findById(row.matchedAccountId()).ifPresent(contact::setAccount);
            }

            Contact saved = contactRepository.save(contact);
            affectedIds.add(saved.getId());
            importedCount++;
        }

        // Clean up session once executed
        sessionRegistry.remove(session.sessionId());

        long durationMs = System.currentTimeMillis() - startTime;
        log.info("Contact import finished successfully: sessionId={}, imported={}, updated={}, skipped={}, failed={}, durationMs={}",
                session.sessionId(), importedCount, updatedCount, skippedCount, failedCount, durationMs);

        return new ImportResultReport(
                session.sessionId(),
                rows.size(),
                importedCount,
                updatedCount,
                skippedCount,
                failedCount,
                durationMs,
                affectedIds,
                finalErrors,
                Instant.now()
        );
    }

    /**
     * Cancels an active import session without modifying database records.
     */
    public void cancelSession(String sessionId) {
        sessionRegistry.remove(sessionId);
    }

    private ParsedContactRow parseAndValidateRow(
            int rowNumber,
            List<String> rawRow,
            List<String> headers,
            Map<String, String> mappedFields,
            Map<String, Long> accountNameToId,
            Map<String, Long> accountDomainToId
    ) {
        Map<String, String> valuesByField = new HashMap<>();
        for (int i = 0; i < headers.size() && i < rawRow.size(); i++) {
            String header = headers.get(i);
            String targetField = mappedFields.get(header);
            if (targetField != null) {
                valuesByField.put(targetField, rawRow.get(i));
            }
        }

        List<ImportErrorDetail> errors = new ArrayList<>();

        String firstName = valuesByField.get(ContactColumnMapper.FIELD_FIRST_NAME);
        if (firstName == null || firstName.isBlank()) {
            errors.add(new ImportErrorDetail(rowNumber, "firstName", firstName, "First name is required"));
        } else if (firstName.length() > 80) {
            errors.add(new ImportErrorDetail(rowNumber, "firstName", firstName, "First name must not exceed 80 characters"));
        }

        String lastName = valuesByField.get(ContactColumnMapper.FIELD_LAST_NAME);
        if (lastName == null || lastName.isBlank()) {
            errors.add(new ImportErrorDetail(rowNumber, "lastName", lastName, "Last name is required"));
        } else if (lastName.length() > 80) {
            errors.add(new ImportErrorDetail(rowNumber, "lastName", lastName, "Last name must not exceed 80 characters"));
        }

        String email = valuesByField.get(ContactColumnMapper.FIELD_EMAIL);
        if (email == null || email.isBlank()) {
            errors.add(new ImportErrorDetail(rowNumber, "email", email, "Email is required"));
        } else if (email.length() > 160) {
            errors.add(new ImportErrorDetail(rowNumber, "email", email, "Email must not exceed 160 characters"));
        } else if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
            errors.add(new ImportErrorDetail(rowNumber, "email", email, "Email must be a valid email address"));
        }

        String phone = valuesByField.get(ContactColumnMapper.FIELD_PHONE);
        if (phone != null && !phone.isBlank() && phone.length() > 32) {
            errors.add(new ImportErrorDetail(rowNumber, "phone", phone, "Phone must not exceed 32 characters"));
        }

        String jobTitle = valuesByField.get(ContactColumnMapper.FIELD_JOB_TITLE);
        if (jobTitle != null && !jobTitle.isBlank() && jobTitle.length() > 100) {
            errors.add(new ImportErrorDetail(rowNumber, "jobTitle", jobTitle, "Job title must not exceed 100 characters"));
        }

        String rawStatus = valuesByField.get(ContactColumnMapper.FIELD_STATUS);
        if (rawStatus != null && !rawStatus.isBlank()) {
            try {
                ContactStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                errors.add(new ImportErrorDetail(rowNumber, "status", rawStatus, "Invalid status. Supported values: LEAD, PROSPECT, CUSTOMER, CHURNED"));
            }
        }

        String notes = valuesByField.get(ContactColumnMapper.FIELD_NOTES);

        // Account Matching
        String accountIdentifier = valuesByField.get(ContactColumnMapper.FIELD_ACCOUNT);
        Long matchedAccountId = null;
        if (accountIdentifier != null && !accountIdentifier.isBlank()) {
            String cleanAcc = accountIdentifier.trim().toLowerCase(Locale.ROOT);
            matchedAccountId = accountDomainToId.get(cleanAcc);
            if (matchedAccountId == null) {
                matchedAccountId = accountNameToId.get(cleanAcc);
            }
        }

        // Duplicate Check against DB
        boolean isDuplicate = false;
        Long matchedContactId = null;
        if (email != null && !email.isBlank()) {
            Optional<Contact> existingContact = contactRepository.findByEmailIgnoreCase(email.trim());
            if (existingContact.isPresent()) {
                isDuplicate = true;
                matchedContactId = existingContact.get().getId();
            }
        }

        boolean valid = errors.isEmpty();

        return new ParsedContactRow(
                rowNumber,
                firstName != null ? firstName.trim() : null,
                lastName != null ? lastName.trim() : null,
                email != null ? email.trim().toLowerCase(Locale.ROOT) : null,
                phone != null && !phone.isBlank() ? phone.trim() : null,
                jobTitle != null && !jobTitle.isBlank() ? jobTitle.trim() : null,
                rawStatus != null && !rawStatus.isBlank() ? rawStatus.trim().toUpperCase(Locale.ROOT) : "LEAD",
                notes != null && !notes.isBlank() ? notes.trim() : null,
                accountIdentifier != null ? accountIdentifier.trim() : null,
                valid,
                isDuplicate,
                matchedContactId,
                matchedAccountId,
                errors
        );
    }

    private void updateContactFromRow(Contact contact, ParsedContactRow row) {
        if (row.firstName() != null && !row.firstName().isBlank()) {
            contact.setFirstName(row.firstName());
        }
        if (row.lastName() != null && !row.lastName().isBlank()) {
            contact.setLastName(row.lastName());
        }
        if (row.phone() != null && !row.phone().isBlank()) {
            contact.setPhone(row.phone());
        }
        if (row.jobTitle() != null && !row.jobTitle().isBlank()) {
            contact.setJobTitle(row.jobTitle());
        }
        if (row.status() != null && !row.status().isBlank()) {
            contact.setStatus(resolveContactStatus(row.status()));
        }
        if (row.notes() != null && !row.notes().isBlank()) {
            contact.setNotes(row.notes());
        }
        if (row.matchedAccountId() != null) {
            accountRepository.findById(row.matchedAccountId()).ifPresent(contact::setAccount);
        }
    }

    private ContactStatus resolveContactStatus(String statusStr) {
        if (statusStr == null || statusStr.isBlank()) {
            return ContactStatus.LEAD;
        }
        try {
            return ContactStatus.valueOf(statusStr.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ContactStatus.LEAD;
        }
    }
}

