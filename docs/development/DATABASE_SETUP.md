# VoicePilot AI - Database Configuration & Operations Guide

This guide describes local MySQL 8 initialization, Flyway migration workflows, environment configuration, and troubleshooting steps.

---

## 1. Required Environment Variables

All database settings are externalized and configured via environment variables. Create a local `.env` file based on `.env.example`:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DB_HOST` | `localhost` | Database server hostname or container IP. |
| `DB_PORT` | `3306` | Port on which MySQL server is listening. |
| `DB_NAME` | `voicepilot` | Database schema name. |
| `DB_USER` | `voicepilot_user` | Application database user with DDL and DML grants. |
| `DB_PASSWORD` | `voicepilot_pass` | Application database user password. |
| `DB_ROOT_PASSWORD` | `rootpassword` | Root administrative password (used for Docker setup). |

> **Security Notice**: Never commit `.env` or files containing real database passwords. They are excluded via `.gitignore`.

---

## 2. Local Database Initialization & Startup

### Option A: Native Windows MySQL 8 (Recommended if MySQL service is installed)
The host machine has Windows Service `MySQL80` running on port `3306`.

1. **Connect as administrative root user**:
   ```cmd
   "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
   ```
2. **Create the VoicePilot database and dedicated user**:
   ```sql
   CREATE DATABASE IF NOT EXISTS voicepilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'voicepilot_user'@'localhost' IDENTIFIED BY 'voicepilot_pass';
   GRANT ALL PRIVILEGES ON voicepilot.* TO 'voicepilot_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### Option B: Docker Compose (When Docker Desktop is installed & active)
If utilizing containerized infrastructure:

1. **Start the MySQL container**:
   ```bash
   docker compose -f infrastructure/database/docker-compose.yml up -d
   ```
2. **Check container logs & health**:
   ```bash
   docker compose -f infrastructure/database/docker-compose.yml ps
   docker compose -f infrastructure/database/docker-compose.yml logs -f mysql
   ```
3. **Stop the container**:
   ```bash
   docker compose -f infrastructure/database/docker-compose.yml down
   ```
   *(Note: The `mysql_data` volume is persistent and preserves all schema and data across restarts).*

---

## 3. Flyway Migration Strategy

- **Location**: `backend/src/main/resources/db/migration/`
- **Naming Rule**: `V<Version>__<Description>.sql` (e.g. `V1__init_system_baseline.sql`).
- **Baseline Migration (V1)**: Creates `sys_baseline_metadata` and inserts initial system tracking metadata.
- **Hibernate Integration**: Hibernate is explicitly configured with:
  ```yaml
  spring.jpa.hibernate.ddl-auto: validate
  ```
  Hibernate never modifies or creates tables directly in the database; it strictly validates that the entities match the schema established by Flyway migrations.

---

## 4. Health Inspection & Telemetry

The application exposes independent telemetry for application runtime and database connectivity via:
`GET /api/v1/health`

### Response with Database Healthy:
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "version": "0.0.1-SNAPSHOT",
    "components": {
      "application": { "status": "UP", "details": "Application runtime running cleanly" },
      "database": { "status": "UP", "details": "Connected to MySQL (8.0.x)" }
    }
  }
}
```

### Response if Database Connection is Offline / Unreachable:
```json
{
  "success": true,
  "data": {
    "status": "UP",
    "version": "0.0.1-SNAPSHOT",
    "components": {
      "application": { "status": "UP", "details": "Application runtime running cleanly" },
      "database": { "status": "DOWN", "details": "Database connection failed: Communications link failure" }
    }
  }
}
```
*(Notice that the overall application status remains `UP`, ensuring monitoring systems can distinguish web service health from downstream database timeouts).*

---

## 5. Troubleshooting & Diagnostics

1. **Connection Refused / Communications link failure**:
   - Verify if port 3306 is listening:
     ```powershell
     Test-NetConnection -ComputerName localhost -Port 3306
     ```
   - Ensure the MySQL service is running:
     ```powershell
     Get-Service *mysql*
     ```
2. **Access Denied for User**:
   - Verify `DB_USER` and `DB_PASSWORD` in your local environment match the grants in MySQL.
3. **Flyway Migration Checksum Mismatch**:
   - Never edit a migration file that has already been executed. Create a forward migration (`V2__...sql`).
