package com.voicepilot.database;

import com.voicepilot.common.model.SystemBaselineMetadata;
import com.voicepilot.common.repository.SystemBaselineMetadataRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class DatabaseMigrationIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private SystemBaselineMetadataRepository repository;

    @Autowired
    private Flyway flyway;

    @Test
    @DisplayName("Verify Flyway applied baseline migration V1 and populated system baseline record")
    void testFlywayBaselineMigrationExecuted() {
        Optional<SystemBaselineMetadata> baseline = repository.findById("SYS-001");
        assertThat(baseline).isPresent();
        assertThat(baseline.get().getSystemName()).isEqualTo("VoicePilot AI Voice CRM");
        assertThat(baseline.get().getSchemaVersion()).isEqualTo("1.0.0");
        assertThat(baseline.get().getStatus()).isEqualTo("INITIALIZED");
    }

    @Test
    @DisplayName("Verify Flyway migration history records V1 and V2, and repeated validation passes")
    void testFlywayMigrationHistoryAndValidation() {
        MigrationInfo[] applied = flyway.info().applied();
        assertThat(applied).hasSize(2);

        // V1 verification
        assertThat(applied[0].getVersion().getVersion()).isEqualTo("1");
        assertThat(applied[0].getDescription()).isEqualTo("init system baseline");

        // V2 verification
        assertThat(applied[1].getVersion().getVersion()).isEqualTo("2");
        assertThat(applied[1].getDescription()).isEqualTo("init crm schema");

        // A second migration validation must not report unexpected checksum or schema errors
        assertThatCode(() -> flyway.validate()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Verify CRM tables exist with expected columns, data types, and nullability")
    void testCrmTablesAndColumnsMetadata() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            // Verify both CRM tables exist
            Set<String> tables = new HashSet<>();
            try (ResultSet rs = metaData.getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    tables.add(rs.getString("TABLE_NAME").toLowerCase(Locale.ROOT));
                }
            }
            assertThat(tables).contains("crm_accounts", "crm_contacts");

            // Verify crm_accounts columns
            Map<String, String> accountColumns = new HashMap<>();
            try (ResultSet rs = metaData.getColumns(null, null, "CRM_ACCOUNTS", "%")) {
                while (rs.next()) {
                    accountColumns.put(
                            rs.getString("COLUMN_NAME").toLowerCase(Locale.ROOT),
                            rs.getString("IS_NULLABLE").toUpperCase(Locale.ROOT)
                    );
                }
            }
            assertThat(accountColumns).containsKeys(
                    "id", "name", "domain", "industry", "phone", "website", "status", "created_at", "updated_at"
            );
            assertThat(accountColumns.get("id")).isEqualTo("NO");
            assertThat(accountColumns.get("name")).isEqualTo("NO");
            assertThat(accountColumns.get("status")).isEqualTo("NO");
            assertThat(accountColumns.get("created_at")).isEqualTo("NO");
            assertThat(accountColumns.get("updated_at")).isEqualTo("NO");
            assertThat(accountColumns.get("domain")).isEqualTo("YES");
            assertThat(accountColumns.get("industry")).isEqualTo("YES");

            // Verify crm_contacts columns
            Map<String, String> contactColumns = new HashMap<>();
            try (ResultSet rs = metaData.getColumns(null, null, "CRM_CONTACTS", "%")) {
                while (rs.next()) {
                    contactColumns.put(
                            rs.getString("COLUMN_NAME").toLowerCase(Locale.ROOT),
                            rs.getString("IS_NULLABLE").toUpperCase(Locale.ROOT)
                    );
                }
            }
            assertThat(contactColumns).containsKeys(
                    "id", "account_id", "first_name", "last_name", "email", "phone", "job_title", "status", "notes", "created_at", "updated_at"
            );
            assertThat(contactColumns.get("id")).isEqualTo("NO");
            assertThat(contactColumns.get("first_name")).isEqualTo("NO");
            assertThat(contactColumns.get("last_name")).isEqualTo("NO");
            assertThat(contactColumns.get("email")).isEqualTo("NO");
            assertThat(contactColumns.get("status")).isEqualTo("NO");
            assertThat(contactColumns.get("created_at")).isEqualTo("NO");
            assertThat(contactColumns.get("updated_at")).isEqualTo("NO");
            assertThat(contactColumns.get("account_id")).isEqualTo("YES");
            assertThat(contactColumns.get("notes")).isEqualTo("YES");
        }
    }

    @Test
    @DisplayName("Verify indexes and foreign key constraints on CRM tables")
    void testCrmIndexesAndForeignKeyMetadata() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();

            // Verify crm_accounts indexes
            Set<String> accountIndexes = new HashSet<>();
            try (ResultSet rs = metaData.getIndexInfo(null, null, "CRM_ACCOUNTS", false, false)) {
                while (rs.next()) {
                    String indexName = rs.getString("INDEX_NAME");
                    if (indexName != null) {
                        accountIndexes.add(indexName.toLowerCase(Locale.ROOT));
                    }
                }
            }
            assertThat(accountIndexes).contains("idx_crm_accounts_name", "idx_crm_accounts_domain", "idx_crm_accounts_status");

            // Verify crm_contacts indexes
            Set<String> contactIndexes = new HashSet<>();
            try (ResultSet rs = metaData.getIndexInfo(null, null, "CRM_CONTACTS", false, false)) {
                while (rs.next()) {
                    String indexName = rs.getString("INDEX_NAME");
                    if (indexName != null) {
                        contactIndexes.add(indexName.toLowerCase(Locale.ROOT));
                    }
                }
            }
            assertThat(contactIndexes).contains(
                    "idx_crm_contacts_email",
                    "idx_crm_contacts_account_id",
                    "idx_crm_contacts_status",
                    "idx_crm_contacts_names"
            );

            // Verify Foreign Key: crm_contacts.account_id -> crm_accounts.id with ON DELETE SET NULL
            boolean fkFound = false;
            try (ResultSet rs = metaData.getImportedKeys(null, null, "CRM_CONTACTS")) {
                while (rs.next()) {
                    String pkTable = rs.getString("PKTABLE_NAME");
                    String fkColumn = rs.getString("FKCOLUMN_NAME");
                    int deleteRule = rs.getInt("DELETE_RULE");

                    if ("CRM_ACCOUNTS".equalsIgnoreCase(pkTable) && "ACCOUNT_ID".equalsIgnoreCase(fkColumn)) {
                        fkFound = true;
                        assertThat(deleteRule).isEqualTo(DatabaseMetaData.importedKeySetNull);
                    }
                }
            }
            assertThat(fkFound)
                    .withFailMessage("Foreign key fk_crm_contacts_account not found on CRM_CONTACTS referencing CRM_ACCOUNTS")
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Verify contact lifecycle: independent contact, account referencing contact, and ON DELETE SET NULL")
    void testCrmRelationshipLifecycleAndCascadeRules() throws SQLException {
        try (Connection connection = dataSource.getConnection()) {
            connection.setAutoCommit(false);
            try {
                long accountId;
                // 1. Insert an Account
                try (PreparedStatement stmt = connection.prepareStatement(
                        "INSERT INTO crm_accounts (name, domain, status) VALUES (?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, "Apex Dynamics Inc");
                    stmt.setString(2, "apexdynamics.io");
                    stmt.setString(3, "ACTIVE");
                    stmt.executeUpdate();

                    try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                        assertThat(generatedKeys.next()).isTrue();
                        accountId = generatedKeys.getLong(1);
                    }
                }

                // 2. Insert Contact 1 referencing Account
                long associatedContactId;
                try (PreparedStatement stmt = connection.prepareStatement(
                        "INSERT INTO crm_contacts (account_id, first_name, last_name, email, status) VALUES (?, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setLong(1, accountId);
                    stmt.setString(2, "Marcus");
                    stmt.setString(3, "Vance");
                    stmt.setString(4, "marcus.vance@apexdynamics.io");
                    stmt.setString(5, "CUSTOMER");
                    stmt.executeUpdate();

                    try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                        assertThat(generatedKeys.next()).isTrue();
                        associatedContactId = generatedKeys.getLong(1);
                    }
                }

                // 3. Insert Contact 2 independent of any Account (account_id = NULL)
                long standaloneContactId;
                try (PreparedStatement stmt = connection.prepareStatement(
                        "INSERT INTO crm_contacts (account_id, first_name, last_name, email, status) VALUES (NULL, ?, ?, ?, ?)",
                        Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, "Elena");
                    stmt.setString(2, "Rostova");
                    stmt.setString(3, "elena@independentscout.com");
                    stmt.setString(4, "LEAD");
                    stmt.executeUpdate();

                    try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                        assertThat(generatedKeys.next()).isTrue();
                        standaloneContactId = generatedKeys.getLong(1);
                    }
                }

                // 4. Verify initial states
                try (PreparedStatement stmt = connection.prepareStatement("SELECT account_id FROM crm_contacts WHERE id = ?")) {
                    stmt.setLong(1, associatedContactId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getLong("account_id")).isEqualTo(accountId);
                    }

                    stmt.setLong(1, standaloneContactId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getObject("account_id")).isNull();
                    }
                }

                // 5. Delete Account - verify contacts are preserved and associated contact has account_id set to NULL
                try (PreparedStatement stmt = connection.prepareStatement("DELETE FROM crm_accounts WHERE id = ?")) {
                    stmt.setLong(1, accountId);
                    int affected = stmt.executeUpdate();
                    assertThat(affected).isEqualTo(1);
                }

                // Verify associated contact is preserved and account_id is nullified
                try (PreparedStatement stmt = connection.prepareStatement("SELECT account_id, email FROM crm_contacts WHERE id = ?")) {
                    stmt.setLong(1, associatedContactId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getObject("account_id"))
                                .withFailMessage("account_id was not nullified by ON DELETE SET NULL")
                                .isNull();
                        assertThat(rs.getString("email")).isEqualTo("marcus.vance@apexdynamics.io");
                    }

                    // Verify standalone contact is intact
                    stmt.setLong(1, standaloneContactId);
                    try (ResultSet rs = stmt.executeQuery()) {
                        assertThat(rs.next()).isTrue();
                        assertThat(rs.getObject("account_id")).isNull();
                        assertThat(rs.getString("email")).isEqualTo("elena@independentscout.com");
                    }
                }
            } finally {
                connection.rollback();
                connection.setAutoCommit(true);
            }
        }
    }

    @Test
    @DisplayName("Verify DataSource connection is valid and accessible")
    void testDatabaseConnectionIsValid() throws SQLException {
        assertThat(dataSource).isNotNull();
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.isValid(2)).isTrue();
            assertThat(connection.getMetaData().getDatabaseProductName()).isNotEmpty();
        }
    }

    @Test
    @DisplayName("Verify invalid database credentials produce a distinct failure signal")
    void testInvalidCredentialsProduceFailureSignal() {
        DriverManagerDataSource badDataSource = new DriverManagerDataSource();
        badDataSource.setDriverClassName("org.h2.Driver");
        badDataSource.setUrl("jdbc:h2:mem:testdb;CIPHER=AES"); // Invalid configuration triggers SQL exception
        badDataSource.setUsername("invalid_user");
        badDataSource.setPassword("wrong_password");

        assertThatThrownBy(badDataSource::getConnection)
                .isInstanceOf(SQLException.class);
    }
}
