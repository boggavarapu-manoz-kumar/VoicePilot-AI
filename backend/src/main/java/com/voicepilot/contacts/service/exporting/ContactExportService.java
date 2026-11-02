package com.voicepilot.contacts.service.exporting;

import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.ContactStatus;
import com.voicepilot.contacts.repository.ContactRepository;
import com.voicepilot.contacts.repository.ContactSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Enterprise service for exporting contacts to CSV format using memory-safe batch streaming.
 */
@Service
@Transactional(readOnly = true)
public class ContactExportService {

    private static final int BATCH_SIZE = 250;
    private final ContactRepository contactRepository;
    private final ContactCsvSerializer serializer;

    public ContactExportService(ContactRepository contactRepository, ContactCsvSerializer serializer) {
        this.contactRepository = contactRepository;
        this.serializer = serializer;
    }

    /**
     * Streams contacts matching filter criteria (or specific IDs) directly to the output stream.
     * Uses paginated chunking (250 records per query) to prevent memory exhaustion on large datasets.
     */
    public void exportContactsCsv(
            String searchTerm,
            ContactStatus status,
            Long accountId,
            Boolean withoutAccount,
            List<Long> selectedIds,
            OutputStream outputStream
    ) throws IOException {
        OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);

        // Write UTF-8 BOM so Excel properly identifies UTF-8 characters
        outputStream.write(0xEF);
        outputStream.write(0xBB);
        outputStream.write(0xBF);

        // Write Header
        writer.write(serializer.writeHeader());
        writer.flush();

        Specification<Contact> spec = Specification.where(ContactSpecifications.withSearchTerm(searchTerm))
                .and(ContactSpecifications.withStatus(status));

        if (Boolean.TRUE.equals(withoutAccount)) {
            spec = spec.and(ContactSpecifications.withoutAccount());
        } else if (accountId != null) {
            spec = spec.and(ContactSpecifications.withAccountId(accountId));
        }

        if (selectedIds != null && !selectedIds.isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("id").in(selectedIds));
        }

        int pageNumber = 0;
        boolean hasMore = true;

        while (hasMore) {
            PageRequest pageRequest = PageRequest.of(pageNumber, BATCH_SIZE, Sort.by(Sort.Direction.ASC, "id"));
            Page<Contact> batch = contactRepository.findAll(spec, pageRequest);

            for (Contact contact : batch.getContent()) {
                String accountName = contact.getAccount() != null ? contact.getAccount().getName() : "";
                String accountDomain = contact.getAccount() != null && contact.getAccount().getDomain() != null
                        ? contact.getAccount().getDomain()
                        : "";

                String line = serializer.writeRow(
                        contact.getFirstName(),
                        contact.getLastName(),
                        contact.getEmail(),
                        contact.getPhone(),
                        contact.getJobTitle(),
                        contact.getStatus() != null ? contact.getStatus().name() : "",
                        accountName,
                        accountDomain,
                        contact.getNotes(),
                        contact.getCreatedAt()
                );
                writer.write(line);
            }

            writer.flush();
            hasMore = batch.hasNext();
            pageNumber++;
        }
    }
}

