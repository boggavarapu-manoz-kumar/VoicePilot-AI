package com.voicepilot.contacts.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.common.api.PageResponse;
import com.voicepilot.common.exception.ResourceConflictException;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.contacts.dto.ContactResponse;
import com.voicepilot.contacts.dto.CreateSegmentRequest;
import com.voicepilot.contacts.dto.SegmentFilterCriteria;
import com.voicepilot.contacts.dto.SegmentResponse;
import com.voicepilot.contacts.dto.UpdateSegmentRequest;
import com.voicepilot.contacts.model.Contact;
import com.voicepilot.contacts.model.Segment;
import com.voicepilot.contacts.repository.ContactRepository;
import com.voicepilot.contacts.repository.ContactSpecifications;
import com.voicepilot.contacts.repository.SegmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

/**
 * Application service for managing saved CRM Contact Segments.
 *
 * <p>Segments store structured filter criteria as JSON. Filter execution always passes
 * through {@link SegmentFilterCriteria} deserialization and then through
 * {@link ContactSpecifications} — raw SQL or expressions are never evaluated from user input.</p>
 *
 * <p>Segments are workspace-scoped (not user-owned) because this application has no
 * user identity model. This is a documented architectural limitation.</p>
 */
@Service
@Transactional(readOnly = true)
public class SegmentService {

    private final SegmentRepository segmentRepository;
    private final ContactRepository contactRepository;
    private final ObjectMapper objectMapper;

    public SegmentService(SegmentRepository segmentRepository,
                          ContactRepository contactRepository,
                          ObjectMapper objectMapper) {
        this.segmentRepository = Objects.requireNonNull(segmentRepository, "segmentRepository must not be null");
        this.contactRepository = Objects.requireNonNull(contactRepository, "contactRepository must not be null");
        this.objectMapper = Objects.requireNonNull(objectMapper, "objectMapper must not be null");
    }

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    /**
     * Creates and persists a new named segment.
     * Rejects duplicate names to maintain a clean segment catalogue.
     */
    @Transactional
    public SegmentResponse createSegment(CreateSegmentRequest request) {
        Objects.requireNonNull(request, "create request must not be null");

        if (segmentRepository.findByName(request.name().trim()).isPresent()) {
            throw new ResourceConflictException("A segment named '" + request.name().trim() + "' already exists");
        }

        String criteriaJson = serializeCriteria(request.filterCriteria());
        Segment segment = new Segment(request.name().trim(), trimToNull(request.description()), criteriaJson);
        Segment saved = segmentRepository.save(segment);

        SegmentFilterCriteria criteria = request.filterCriteria();
        long count = countMatchingContacts(criteria);
        return SegmentResponse.from(saved, criteria, count);
    }

    /**
     * Retrieves a single segment by ID, including a live count of matching contacts.
     */
    public SegmentResponse getSegmentById(Long id) {
        Segment segment = requireSegment(id);
        SegmentFilterCriteria criteria = deserializeCriteria(segment.getFilterCriteria());
        long count = countMatchingContacts(criteria);
        return SegmentResponse.from(segment, criteria, count);
    }

    /**
     * Lists all segments (paginated), each with a live matching-contact count.
     */
    public PageResponse<SegmentResponse> listSegments(Pageable pageable) {
        Page<Segment> page = segmentRepository.findAll(pageable);
        return PageResponse.from(page, segment -> {
            SegmentFilterCriteria criteria = deserializeCriteria(segment.getFilterCriteria());
            long count = countMatchingContacts(criteria);
            return SegmentResponse.from(segment, criteria, count);
        });
    }

    /**
     * Updates the name, description and filter criteria of an existing segment.
     * Rejects a rename to an existing name owned by a different segment.
     */
    @Transactional
    public SegmentResponse updateSegment(Long id, UpdateSegmentRequest request) {
        Objects.requireNonNull(request, "update request must not be null");
        Segment segment = requireSegment(id);

        String trimmedName = request.name().trim();
        if (!trimmedName.equals(segment.getName())) {
            segmentRepository.findByName(trimmedName).ifPresent(existing -> {
                if (!existing.getId().equals(segment.getId())) {
                    throw new ResourceConflictException("A segment named '" + trimmedName + "' already exists");
                }
            });
        }

        segment.setName(trimmedName);
        segment.setDescription(trimToNull(request.description()));
        segment.setFilterCriteria(serializeCriteria(request.filterCriteria()));
        Segment updated = segmentRepository.save(segment);

        SegmentFilterCriteria criteria = request.filterCriteria();
        long count = countMatchingContacts(criteria);
        return SegmentResponse.from(updated, criteria, count);
    }

    /**
     * Deletes a segment by ID. Does not cascade to any contacts.
     */
    @Transactional
    public void deleteSegment(Long id) {
        Segment segment = requireSegment(id);
        segmentRepository.delete(segment);
    }

    // -------------------------------------------------------------------------
    // Contact execution
    // -------------------------------------------------------------------------

    /**
     * Retrieves paginated contacts matching the filter criteria of a segment.
     * This is read-only: it never creates or modifies contacts.
     */
    public PageResponse<ContactResponse> getSegmentContacts(Long segmentId, Pageable pageable) {
        Segment segment = requireSegment(segmentId);
        SegmentFilterCriteria criteria = deserializeCriteria(segment.getFilterCriteria());
        Specification<Contact> spec = buildSpecification(criteria);
        Page<Contact> page = contactRepository.findAll(spec, pageable);
        return PageResponse.from(page, ContactResponse::from);
    }

    /**
     * Returns the filter criteria for use by export pipelines.
     * Callers receive a typed {@link SegmentFilterCriteria} — never raw JSON.
     */
    public SegmentFilterCriteria getSegmentCriteria(Long segmentId) {
        Segment segment = requireSegment(segmentId);
        return deserializeCriteria(segment.getFilterCriteria());
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private long countMatchingContacts(SegmentFilterCriteria criteria) {
        return contactRepository.count(buildSpecification(criteria));
    }

    private Specification<Contact> buildSpecification(SegmentFilterCriteria criteria) {
        Specification<Contact> spec = Specification
                .where(ContactSpecifications.withSearchTerm(criteria.search()))
                .and(ContactSpecifications.withStatus(criteria.status()));

        if (Boolean.TRUE.equals(criteria.withoutAccount())) {
            spec = spec.and(ContactSpecifications.withoutAccount());
        } else if (criteria.accountId() != null) {
            spec = spec.and(ContactSpecifications.withAccountId(criteria.accountId()));
        }
        return spec;
    }

    private String serializeCriteria(SegmentFilterCriteria criteria) {
        try {
            return objectMapper.writeValueAsString(criteria);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Invalid filter criteria: " + e.getMessage(), e);
        }
    }

    private SegmentFilterCriteria deserializeCriteria(String json) {
        try {
            return objectMapper.readValue(json, SegmentFilterCriteria.class);
        } catch (JsonProcessingException e) {
            // Stored JSON should always be valid; if not, surface as a 500-level error
            throw new IllegalStateException("Stored filter criteria is corrupt: " + e.getMessage(), e);
        }
    }

    private Segment requireSegment(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Segment ID must not be null");
        }
        return segmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Segment", id));
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
