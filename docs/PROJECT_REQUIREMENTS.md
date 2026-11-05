# Software Requirements Specification (SRS)
## Project: Staff Management Portal

---

## 1. Document Control & Overview

| Attribute | Details |
|---|---|
| **Document Title** | Software Requirements Specification – Staff Management Portal |
| **Project Name** | Staff Management Portal |
| **Project Type** | Full-Stack Web Application |
| **Version** | 1.0.0 |
| **Status** | Approved Specification – Pending Implementation Authorization |

### 1.1 Project Description
The **Staff Management Portal** is a full-stack enterprise web application designed to manage employee records with comprehensive Create, Read, Update, and Delete (CRUD) operations, supported by a dual-authentication system combining standard Email/Password authentication and Google OAuth 2.0 / OpenID Connect sign-in.

### 1.2 Project Objectives
- Provide a unified, secure authentication gateway allowing users to register and sign in via traditional credentials or Google Single Sign-On (SSO).
- Ensure unified identity management where users authenticated through either provider access a common dashboard without duplicate accounts.
- Implement robust Employee CRUD operations backed by Spring Boot, Spring Data JPA, and MySQL.
- Secure all REST APIs with stateless JSON Web Tokens (JWT) and Spring Security.
- Provide a responsive, modular React.js user interface for seamless employee administration.

---

## 2. Technology Stack & Environment

| Layer / Component | Technology Selected | Description & Constraints |
|---|---|---|
| **Frontend Framework** | React.js | Modular, component-driven SPA architecture |
| **Programming Language** | Java 17 | Backend runtime (LTS) |
| **Backend Framework** | Spring Boot (v3.x compatible) | RESTful API service framework |
| **Security Framework** | Spring Security | Role/session/token management & OAuth2 client |
| **Primary Authentication** | Email & Password | Custom registration/login with BCrypt hashing |
| **Secondary Authentication** | Google OAuth 2.0 / OpenID Connect | Google Sign-In with backend token validation |
| **Token Management** | JSON Web Token (JWT) | Stateless backend-generated application access tokens |
| **Password Encryption** | BCrypt (`BCryptPasswordEncoder`) | One-way salted password hashing |
| **Relational Database** | MySQL | Persistent relational database storage |
| **ORM / Persistence** | Spring Data JPA / Hibernate | Object-Relational Mapping & repository abstraction |
| **Build & Dependency Tool** | Apache Maven | Project lifecycle management |
| **API Testing & Verification** | Postman | Automated / manual REST endpoint validation |
| **Version Control** | Git & GitHub | Branch-per-endpoint feature workflow |

> *Note: Technologies are strictly defined and must not be substituted without explicit authorization.*

---

## 3. Functional Requirements

### Module 1: User Registration
Allows new users to create an application account using credentials.

- **Registration Fields:**
  - Full Name (`full_name`) – Required, text string.
  - Email Address (`email`) – Required, valid email format, unique across system.
  - Password (`password`) – Required, strength-validated.
  - Confirm Password – Required, must match `password` identically.

- **Business Rules & Validations:**
  1. Mandatory field validation on frontend and backend.
  2. Format validation for email addresses.
  3. Pre-existence check: Reject registration if email already exists in `users` table.
  4. Passwords encrypted using BCrypt before persistence.
  5. Store record in MySQL `users` table with auto-generated timestamps (`created_at`, `updated_at`).
  6. Return standardized HTTP 201 Created response on success.
  7. Return meaningful HTTP 400 Bad Request error messages for validation failures or duplicate records.

---

### Module 2: Email and Password Authentication
Allows registered users to authenticate using credentials and acquire an access token.

- **Login Fields:**
  - Email Address (`email`)
  - Password (`password`)

- **Business Rules & Validations:**
  1. Validate incoming credentials against stored BCrypt hash in MySQL.
  2. Authenticate through Spring Security `AuthenticationManager`.
  3. Issue a signed backend JWT containing user identity and expiration claims upon valid credentials.
  4. Return HTTP 200 OK with the JWT access token and user profile details.
  5. Front-end stores token securely and routes user to the main Employee Dashboard.
  6. Reject invalid credentials with HTTP 401 Unauthorized and clear, generic error messages (preventing user enumeration).
  7. Enforce configured token expiration duration.

---

### Module 3: Google Sign-In (OAuth 2.0 / OpenID Connect)
Provides one-click sign-in using Google accounts via Google Cloud Platform OAuth 2.0.

- **UI Interaction:** A distinct **"Continue with Google"** button on the Login page.

- **Workflow & Business Rules:**
  1. Clicking "Continue with Google" initiates the OAuth 2.0 authorization code flow via Spring Security OAuth2 client (`/oauth2/authorization/google`).
  2. User is redirected to Google's consent screen to choose an account and grant profile/email permissions.
  3. Google redirects back to backend callback endpoint (`/login/oauth2/code/google`) with the authorization code.
  4. Backend exchanges authorization code for Google ID & Access tokens and validates signature, audience, issuer, expiration, and email verification status.
  5. Extract verified user profile details: `email`, `name`, and Google subject identifier (`sub` / `provider_user_id`).
  6. **Account Resolution / Linking:**
     - If user does not exist in `users`: Create new user record with `password = NULL` and link provider record in `user_oauth_accounts`.
     - If user exists (matching verified email): Securely link Google identity into `user_oauth_accounts` if not already linked. Prevent duplicate accounts.
     - Never link accounts automatically if email is unverified by Google.
  7. Backend issues its own application JWT (never passes Google ID token as app session token).
  8. Redirect user to the unified Employee Dashboard.

- **Google Cloud Platform Configuration Requirements:**
  - Google Cloud Project created with OAuth Consent Screen configured.
  - OAuth 2.0 Web Application Client ID & Client Secret.
  - Authorized JavaScript origins (e.g., `http://localhost:3000` in dev).
  - Authorized Redirect URIs (e.g., `http://localhost:8080/login/oauth2/code/google` in dev).
  - Secure credential storage: Client ID and Client Secret stored strictly in environment variables / secure configs; never committed or exposed on frontend.

> *Clarification: This feature is Google OAuth 2.0 Sign-In / SSO, NOT Google Authenticator, TOTP, or MFA.*

---

### Module 4: Unified Authentication System
Guarantees a single source of truth for user identities regardless of login provider.

1. **Symmetric Access:** Both Email/Password and Google OAuth users access the identical dashboard and permissions.
2. **Single Identity:** A single email maps to a single record in `users`.
3. **Password Nullability:** Google-only accounts may have a null password hash. If the user later chooses to set a password, standard credential login becomes available.
4. **Account Linking:** Existing credential users can sign in with Google seamlessly if their verified Google email matches.
5. **Token Architecture:** The backend signs and issues application-specific JWTs for both flows.

---

### Module 5: Employee Management System (CRUD)
Provides authorized users complete lifecycle management of employee entities.

#### Employee Data Model
| Field | Type | Constraint | Description |
|---|---|---|---|
| `id` | Long / BigInt | PK, Auto Increment | Unique Employee Identifier |
| `full_name` | String | Mandatory | Full legal name of the employee |
| `email` | String | Mandatory, Unique | Official corporate email address |
| `phone` | String | Mandatory | Contact telephone number |
| `department` | String | Mandatory | Department / Division (e.g., Engineering, HR) |
| `designation` | String | Mandatory | Job title / Role (e.g., Senior Developer) |
| `salary` | Double / Decimal | Mandatory, Positive | Annual / Monthly compensation |
| `joining_date` | Date / LocalDate | Mandatory | Effective employment start date |
| `created_at` | Timestamp | Auto-populated | Record creation timestamp |
| `updated_at` | Timestamp | Auto-populated | Record modification timestamp |

#### Operations
- **A. Create Employee (`POST /api/employees`):**
  - Validates all mandatory fields.
  - Ensures employee email address is unique.
  - Persists record to MySQL.
  - Returns HTTP 201 Created with saved employee payload.
- **B. Read Employees (`GET /api/employees` & `GET /api/employees/{id}`):**
  - List all employees in tabular format.
  - Retrieve single employee details by ID.
  - Returns HTTP 404 Not Found if requested ID is absent.
- **C. Update Employee (`PUT /api/employees/{id}`):**
  - Updates specified employee attributes.
  - Validates uniqueness of modified email (excluding self).
  - Returns HTTP 200 OK on success or HTTP 400/404 on failure.
- **D. Delete Employee (`DELETE /api/employees/{id}`):**
  - Requires user confirmation on UI dialog before execution.
  - Removes record from MySQL.
  - Returns HTTP 200 OK or HTTP 204 No Content.

*All Employee CRUD operations require valid JWT Bearer authentication.*

---

### Module 6: Employee Dashboard
Interactive administrative dashboard post-authentication.

- **Header / Navigation:**
  - Application brand name ("Staff Management Portal").
  - Current logged-in user profile name & email display.
  - Logout action button.
- **Key Metrics:**
  - Total Employee Count card/widget.
- **Management Interface:**
  - Data table presenting employee records (ID, Name, Email, Department, Designation, Salary, Joining Date).
  - Action buttons per row: "View Details", "Edit", "Delete".
  - "Add Employee" primary action button triggering creation form/modal.
  - Interactive toast/alert notifications for operation success or errors.
  - Confirmation prompt on deletion.

---

### Module 7: Logout
Terminates authenticated sessions cleanly.

1. User clicks "Logout".
2. Clears stored JWT token from client storage (localStorage / sessionStorage / HTTP-only cookies).
3. Resets client-side authentication context state.
4. Optionally triggers backend `/api/auth/logout` endpoint if token blacklisting or cookie invalidation is required.
5. Redirects to `/login` route.
6. Guard routes prevent back-navigation to protected pages.

---

## 4. Database Schema Requirements

### 4.1 Schema Definitions

#### Table 1: `users`
```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NULL, -- Nullable for OAuth-only users
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Table 2: `user_oauth_accounts`
```sql
CREATE TABLE user_oauth_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider VARCHAR(50) NOT NULL, -- e.g., 'GOOGLE'
    provider_user_id VARCHAR(255) NOT NULL, -- Google 'sub' claim
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_provider_account UNIQUE (provider, provider_user_id)
);
```

#### Table 3: `employees`
```sql
CREATE TABLE employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    salary DECIMAL(12, 2) NOT NULL,
    joining_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 4.2 Database Relationships & Integrity
- **One-to-Many:** One record in `users` can possess multiple entries in `user_oauth_accounts`.
- **Decoupling:** `employees` table is decoupled from `users` (administrative staff accounts vs. employee records).
- **Indexes:** Unique indexes on `users.email`, `employees.email`, and compound unique index on `user_oauth_accounts(provider, provider_user_id)`.

---

## 5. REST API Specifications

### 5.1 Authentication Endpoints
| HTTP Method | Route | Description | Authorization | Request Body | Response Status |
|---|---|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public | `{ full_name, email, password, confirm_password }` | 201 Created / 400 Bad Request |
| `POST` | `/api/auth/login` | Authenticate with credentials | Public | `{ email, password }` | 200 OK (`{ token, user }`) / 401 Unauthorized |
| `GET` | `/api/auth/me` | Fetch logged-in user profile | Bearer JWT | None | 200 OK (`{ id, full_name, email }`) / 401 |
| `POST` | `/api/auth/logout` | Session invalidation | Bearer JWT / Public | None | 200 OK |

### 5.2 Google OAuth Endpoints (Spring Security OAuth2 Client)
| HTTP Method | Route | Description | Flow |
|---|---|---|---|
| `GET` | `/oauth2/authorization/google` | Trigger Google OAuth2 login redirect | Handled by Spring Security |
| `GET` | `/login/oauth2/code/google` | OAuth2 authorization code callback | Handled by Spring Security & OAuth2 Success Handler |

### 5.3 Employee Management Endpoints
| HTTP Method | Route | Description | Authorization | Request Body | Response Status |
|---|---|---|---|---|---|
| `POST` | `/api/employees` | Create new employee | Bearer JWT | `{ full_name, email, phone, department, designation, salary, joining_date }` | 201 Created / 400 Bad Request |
| `GET` | `/api/employees` | List all employees | Bearer JWT | None | 200 OK (`[ ...employees ]`) |
| `GET` | `/api/employees/{id}` | Retrieve employee by ID | Bearer JWT | None | 200 OK (`{ ...employee }`) / 404 Not Found |
| `PUT` | `/api/employees/{id}` | Update employee details | Bearer JWT | `{ full_name, email, phone, department, designation, salary, joining_date }` | 200 OK / 400 / 404 |
| `DELETE` | `/api/employees/{id}` | Remove employee by ID | Bearer JWT | None | 200 OK or 204 No Content / 404 |

---

## 6. Frontend Architectural Requirements

### 6.1 Route Structure
1. `/register` – Public Registration Page
2. `/login` – Public Login Page (Email/Password + Continue with Google)
3. `/dashboard` – Protected Employee Dashboard (Metrics + Employee Table)
4. `/employees/new` (or Modal) – Protected Add Employee Form
5. `/employees/:id/edit` (or Modal) – Protected Edit Employee Form
6. `/employees/:id` – Protected Employee Details View
7. `*` – 404 Not Found Page

### 6.2 Frontend Architecture Breakdown
```
frontend/src/
├── assets/          # Static icons, branding assets, styles
├── components/      # Reusable UI elements (Navbar, Modal, Alerts, Table, Form Inputs)
├── context/         # AuthContext (user state, token storage, login/logout handlers)
├── hooks/           # Custom React hooks (useAuth, useEmployees)
├── pages/           # Route views (LoginPage, RegisterPage, DashboardPage, EmployeeDetailsPage)
├── routes/          # ProtectedRoute and PublicRoute router configuration
└── services/        # Axios API client instances with JWT interceptors
```

---

## 7. Security Architecture & Non-Functional Requirements

1. **Password Hashing:** Passwords encrypted via BCrypt with standard salt rounds.
2. **Stateless JWT Tokens:** Application JWT signed with HMAC-SHA256/512 containing claims (`sub`, `iat`, `exp`) and validated on each request via a `JwtAuthenticationFilter`.
3. **OAuth2 Token Validation:** Google ID tokens/authorization codes validated server-side. Never accept arbitrary user identities from client claims.
4. **Secret Management:** OAuth Client Secret, JWT Secret, and DB credentials loaded strictly through environment variables.
5. **CORS Configuration:** Explicit Cross-Origin Resource Sharing whitelist limited to the React application origin.
6. **Input Validation & Sanitization:** Jakarta Bean Validation (`@Valid`, `@NotNull`, `@Email`, etc.) on all DTOs.
7. **HTTP Status Code Discipline:** Standardized REST responses (400 for bad input, 401 for unauthenticated, 403 for forbidden, 404 for missing resource, 500 for unhandled exceptions).
8. **Responsive UI:** CSS / styling responsive across mobile, tablet, and desktop viewports.

---

## 8. Out of Scope

The following capabilities are strictly excluded from the current phase:
- Payroll calculation & processing.
- Attendance & biometric time-tracking.
- Leave & vacation management.
- Employee performance reviews & KPIs.
- Automated email notifications & alerts.
- Advanced analytics & reporting charts.
- Google Authenticator, TOTP, and Multi-Factor Authentication (MFA).

---

## 9. Phased Endpoint-by-Endpoint Development Strategy

Development must be strictly incremental, following an endpoint-by-endpoint lifecycle using Git feature branches:

### Endpoint Lifecycle
1. Create a GitHub Issue specifying endpoint acceptance criteria.
2. Branch from `main`: `feature/<endpoint-name>`.
3. Implement minimal supporting classes (Entity, Repository, DTO, Service, Controller).
4. Verify endpoint via Postman for both 2xx success and 4xx error paths.
5. Commit with conventional commit messages (e.g., `feat(auth): implement user registration API`).
6. Push feature branch and merge into `main` after verification.

### Phased Roadmap
- **Phase 1: Project Setup** (Directory structuring, Maven POM configuration, application properties)
- **Phase 2: MySQL Configuration** (Datasource configuration, schema initialization)
- **Phase 3: Employee CRUD APIs** (Endpoints: POST, GET all, GET by ID, PUT, DELETE)
- **Phase 4: Email/Password Registration and Login** (Endpoints: `/api/auth/register`, `/api/auth/login`)
- **Phase 5: Google OAuth 2.0 Integration** (Spring Security OAuth2 Client, user linking, callback)
- **Phase 6: JWT and Security Integration** (Stateless filter chain, route protection)
- **Phase 7: React Frontend** (UI layout, forms, tables, state management)
- **Phase 8: Frontend and Backend Integration** (Axios interceptors, auth flows, CRUD UI linking)
- **Phase 9: End-to-End Testing & Postman Verification** (Automated & manual testing)
- **Phase 10: Final Documentation & Deployment Readiness**

---

## 10. Acceptance Criteria Checklist

- [x] New user registration functions with validation and BCrypt hashing.
- [x] Registered user can log in with Email and Password, receiving JWT.
- [x] User can sign in using Google OAuth 2.0 / OpenID Connect.
- [x] Users authenticating via either method access the identical Employee Dashboard.
- [x] Employee records can be created, retrieved, updated, and deleted.
- [x] Unauthenticated requests to protected endpoints return HTTP 401.
- [x] Logout invalidates client authentication state.
- [x] All data persists reliably in MySQL database.
- [x] All endpoints verified via Postman test suite.

---

## 11. Live Production Deployment Information

| Resource | Target / URL | Details |
|---|---|---|
| **Production Frontend** | [https://staff-btv0.onrender.com](https://staff-btv0.onrender.com) | Hosted on Render as a React SPA |
| **Production Backend** | [https://staff-backend-mwuh.onrender.com](https://staff-backend-mwuh.onrender.com) | Multi-stage Docker Web Service on Render |
| **Interactive Swagger UI** | [https://staff-backend-mwuh.onrender.com/swagger-ui/index.html](https://staff-backend-mwuh.onrender.com/swagger-ui/index.html) | OpenAPI 3.0 interactive documentation |
| **OpenAPI Specification** | [https://staff-backend-mwuh.onrender.com/v3/api-docs](https://staff-backend-mwuh.onrender.com/v3/api-docs) | Raw OpenAPI JSON schema |
| **Health Check Probe** | [https://staff-backend-mwuh.onrender.com/api/health](https://staff-backend-mwuh.onrender.com/api/health) | Public health probe (Status: UP) |
| **Production Database** | Aiven MySQL Cloud (`defaultdb`) | Enforced SSL (`sslMode=REQUIRED`) |
| **GitHub Repository** | [https://github.com/sudhirkr2003/staff-management-portal](https://github.com/sudhirkr2003/staff-management-portal) | Active repository |
| **Git Branches** | `main`, `develop`, `main-otp` | `main-otp` preserves full email OTP flow |

