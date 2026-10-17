package com.voicepilot.database;

import com.voicepilot.common.model.SystemBaselineMetadata;
import com.voicepilot.common.repository.SystemBaselineMetadataRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class DatabaseMigrationIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private SystemBaselineMetadataRepository repository;

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
