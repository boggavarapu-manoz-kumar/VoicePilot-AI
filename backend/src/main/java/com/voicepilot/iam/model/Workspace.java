package com.voicepilot.iam.model;

import com.voicepilot.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/**
 * Tenant / Workspace boundary entity.
 */
@Entity
@Table(name = "iam_workspaces")
public class Workspace extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "slug", length = 80, nullable = false, unique = true)
    private String slug;

    @Column(name = "plan", length = 32, nullable = false)
    private String plan = "FREE";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Workspace() {
    }

    public Workspace(String name, String slug, String plan) {
        this.name = name;
        this.slug = slug != null ? slug.trim().toLowerCase() : null;
        this.plan = plan != null ? plan : "FREE";
        this.active = true;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug != null ? slug.trim().toLowerCase() : null;
    }

    public String getPlan() {
        return plan;
    }

    public void setPlan(String plan) {
        this.plan = plan;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}

