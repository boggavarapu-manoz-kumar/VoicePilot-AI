package com.voicepilot.iam.model;

import com.voicepilot.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Membership junction entity linking User to Workspace with a specific WorkspaceRole.
 */
@Entity
@Table(name = "iam_workspace_members")
public class WorkspaceMember extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 32, nullable = false)
    private WorkspaceRole role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public WorkspaceMember() {
    }

    public WorkspaceMember(Workspace workspace, User user, WorkspaceRole role) {
        this.workspace = workspace;
        this.user = user;
        this.role = role;
        this.joinedAt = Instant.now();
    }

    public Workspace getWorkspace() {
        return workspace;
    }

    public void setWorkspace(Workspace workspace) {
        this.workspace = workspace;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public WorkspaceRole getRole() {
        return role;
    }

    public void setRole(WorkspaceRole role) {
        this.role = role;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(Instant joinedAt) {
        this.joinedAt = joinedAt;
    }
}

