package com.voicepilot.iam.security;

/**
 * ThreadLocal container holding the active authenticated tenant workspace ID.
 * Follows fail-closed design: throws IllegalStateException if accessed when uninitialized.
 */
public final class TenantContext {

    private static final ThreadLocal<Long> WORKSPACE_ID = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(Long workspaceId) {
        WORKSPACE_ID.set(workspaceId);
    }

    public static Long get() {
        Long id = WORKSPACE_ID.get();
        if (id == null) {
            throw new IllegalStateException("TenantContext not initialized - fail-closed tenant boundary");
        }
        return id;
    }

    public static Long getOrNull() {
        return WORKSPACE_ID.get();
    }

    public static void clear() {
        WORKSPACE_ID.remove();
    }
}

