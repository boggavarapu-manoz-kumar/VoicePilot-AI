package com.voicepilot.contacts.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.voicepilot.common.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing an organization, company, or business account in VoicePilot CRM.
 * Corresponds to the crm_accounts database table established in Flyway V2.
 */
@Entity
@Table(name = "crm_accounts")
public class Account extends BaseEntity {

    private static final long serialVersionUID = 1L;

    @Column(name = "name", length = 160, nullable = false)
    private String name;

    @Column(name = "domain", length = 128)
    private String domain;

    @Column(name = "industry", length = 80)
    private String industry;

    @Column(name = "phone", length = 32)
    private String phone;

    @Column(name = "website", length = 255)
    private String website;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32, nullable = false)
    private AccountStatus status = AccountStatus.ACTIVE;

    @JsonIgnore
    @OneToMany(mappedBy = "account", fetch = FetchType.LAZY)
    private List<Contact> contacts = new ArrayList<>();

    public Account() {
    }

    public Account(String name) {
        this.name = name;
        this.status = AccountStatus.ACTIVE;
    }

    public Account(String name, String domain, String industry, String phone, String website, AccountStatus status) {
        this.name = name;
        this.domain = domain;
        this.industry = industry;
        this.phone = phone;
        this.website = website;
        this.status = status != null ? status : AccountStatus.ACTIVE;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status != null ? status : AccountStatus.ACTIVE;
    }

    public List<Contact> getContacts() {
        return contacts;
    }

    public void setContacts(List<Contact> contacts) {
        this.contacts = contacts != null ? contacts : new ArrayList<>();
    }

    public void addContact(Contact contact) {
        if (contact != null) {
            contacts.add(contact);
            contact.setAccount(this);
        }
    }

    public void removeContact(Contact contact) {
        if (contact != null) {
            contacts.remove(contact);
            contact.setAccount(null);
        }
    }

    @Override
    public String toString() {
        return "Account{" +
                "id=" + getId() +
                ", name='" + name + '\'' +
                ", domain='" + domain + '\'' +
                ", status=" + status +
                '}';
    }
}

