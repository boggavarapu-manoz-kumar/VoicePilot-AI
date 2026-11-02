package com.voicepilot.contacts.model;

import com.voicepilot.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Entity representing a reusable Saved Contact Segment / Filter View.
 * Stores structured filter configurations without duplicating contacts.
 */
@Entity
@Table(name = "crm_segments")
public class Segment extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Column(name = "name", length = 120, nullable = false)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "filter_criteria", columnDefinition = "TEXT", nullable = false)
    private String filterCriteria;

    public Segment() {
    }

    public Segment(String name, String description, String filterCriteria) {
        this.name = name;
        this.description = description;
        this.filterCriteria = filterCriteria;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getFilterCriteria() {
        return filterCriteria;
    }

    public void setFilterCriteria(String filterCriteria) {
        this.filterCriteria = filterCriteria;
    }
}

