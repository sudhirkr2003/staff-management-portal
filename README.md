# Staff Management Portal

An enterprise-grade workforce management platform built with Spring Boot 3, React 18, and MySQL. Provides role-based access control (RBAC), multi-tenant isolated company workspaces, employee lifecycle tracking, department distribution analytics, and OpenAPI 3.0 documentation.

---

## Live Deployments & Key Links

| Resource | URL | Details |
| :--- | :--- | :--- |
| **Production Frontend** | [https://staff-btv0.onrender.com](https://staff-btv0.onrender.com) | Hosted on Render (React 18 + Vite) |
| **Production Backend API** | [https://staff-backend-mwuh.onrender.com](https://staff-backend-mwuh.onrender.com) | Hosted on Render (Multi-stage Docker) |
| **Interactive Swagger UI** | [https://staff-backend-mwuh.onrender.com/swagger-ui/index.html](https://staff-backend-mwuh.onrender.com/swagger-ui/index.html) | Live interactive OpenAPI 3.0 documentation |
| **OpenAPI 3.0 JSON Schema** | [https://staff-backend-mwuh.onrender.com/v3/api-docs](https://staff-backend-mwuh.onrender.com/v3/api-docs) | Machine-readable API schema |
| **Health Check Endpoint** | [https://staff-backend-mwuh.onrender.com/api/health](https://staff-backend-mwuh.onrender.com/api/health) | Uptime probe (Status: `UP`) |
| **Cloud Database** | Aiven MySQL Cloud (`defaultdb`) | Enforced SSL (`sslMode=REQUIRED`) |
| **GitHub Repository** | [https://github.com/sudhirkr2003/staff-management-portal](https://github.com/sudhirkr2003/staff-management-portal) | Source repository |

---

## Git Branch Structure

| Branch | Description | Status |
| :--- | :--- | :--- |
| **`main`** | Production deployment branch with direct admin registration, automated 2-second onboarding transition, and direct password reset. | **Active Production** |
| **`develop`** | Active development branch synchronized with `main`. | **Active Development** |
| **`main-otp`** | Dedicated preservation branch containing the full email OTP registration and password reset implementation. | **Preserved Feature Branch** |

---

## Core Capabilities

- **Direct Administrator Registration:** Instant account creation with password hashing and automated session initialization.
- **Automated Workspace Onboarding:** Success confirmation automatically routes new administrators to company setup after 2 seconds.
- **Company Workspace Isolation:** Multi-tenant architecture ensuring each organization's data remains isolated.
- **Employee Lifecycle Management:** Full CRUD operations covering employee records, salaries, designations, contact info, and departments.
- **Department Distribution Analytics:** Real-time headcount and workforce allocation statistics.
- **Dual Authentication Gateway:** Standard credentials with BCrypt encryption plus Google OAuth 2.0 / OpenID Connect.
- **OpenAPI 3.0 / Swagger UI:** Auto-generated interactive documentation with Bearer JWT authentication support.
- **Automated Health Monitoring:** `/api/health` endpoint integrated for container keep-alive monitoring.

---

## Architecture & Technology Stack

### Backend
- **Runtime:** Java 17 (Eclipse Temurin)
- **Framework:** Spring Boot 3.3.5
- **Security:** Spring Security 6 with stateless JWT filter
- **Data Access:** Spring Data JPA with Hibernate 6
- **Database:** Aiven MySQL 8.0 with HikariCP connection pooling
- **API Docs:** SpringDoc OpenAPI 3.0 (`springdoc-openapi-starter-webmvc-ui` v2.6.0)
- **Containerization:** Multi-stage Dockerfile (`maven:3.9.6` builder + `eclipse-temurin:17-jre` runtime)

### Frontend
- **Framework:** React 18 with Vite 5
- **HTTP Client:** Axios with JWT request/response interceptors
- **Icons:** Lucide React
- **Styles:** Responsive CSS design with unified design system

---

## Environment Variables Reference

### Backend (Render Web Service)

| Variable | Description | Example / Production Value |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Active profile | `prod` |
| `PORT` | Container HTTP port | `8080` |
| `DB_HOST` | MySQL hostname | `staff-portal-mysql-staff-management-prod.b.aivencloud.com` |
| `DB_PORT` | MySQL port | `23668` |
| `DB_NAME` | Database name | `defaultdb` |
| `DB_USERNAME` | Database user | `avnadmin` |
| `DB_PASSWORD` | Database password | `(secret)` |
| `JWT_SECRET` | 256-bit signing key | `(secret)` |
| `APP_OAUTH2_REDIRECT_URL` | Frontend redirect | `https://staff-btv0.onrender.com` |
| `GOOGLE_CLIENT_ID` | OAuth Client ID | `(optional Google Client ID)` |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret | `(optional Google Secret)` |

### Frontend (Render Static Site)

| Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Backend URL | `https://staff-backend-mwuh.onrender.com` |

---

## Local Development Setup

### 1. Database
Ensure a local MySQL instance is running:
```sql
CREATE DATABASE IF NOT EXISTS staff_management_portal;
```

### 2. Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
- API starts at: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- Health check: `http://localhost:8080/api/health`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
- Client starts at: `http://localhost:3000`

---

## Documentation Deliverables

- **Technical Specification (HTML):** `docs/Staff_Management_Portal_Technical_Specification.html`
- **Technical Specification (PDF):** `Staff_Management_Portal_Technical_Specification.pdf` and `docs/Staff_Management_Portal_Technical_Specification.pdf`
- **Software Requirements Specification (SRS):** `docs/PROJECT_REQUIREMENTS.md`
