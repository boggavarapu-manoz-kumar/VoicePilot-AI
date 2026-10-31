package com.voicepilot.contacts.model;

/**
 * Operational lifecycle status for a CRM Contact entity.
 * Persisted as a String name in the database.
 */
public enum ContactStatus {
    LEAD,
    PROSPECT,
    CUSTOMER,
    CHURNED
}

