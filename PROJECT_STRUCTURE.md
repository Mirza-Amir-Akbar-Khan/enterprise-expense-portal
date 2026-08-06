# 🗺️ Project Structure & Architecture Overview

This document provides a visual and graphical overview of the project directory structure, component hierarchy, and architectural flow. **This file should be kept updated whenever new files, directories, or architectural components are added or modified.**

---

## 🌳 Directory Tree Visual

```
.
├── 📄 PROJECT_STRUCTURE.md    # Graphical project structure and documentation
├── 📄 appspec.yml            # AWS CodeDeploy deployment hooks & specs
├── 📄 docker-compose.yml     # Docker container orchestration for backend & database
├── 📁 scripts/
│   └── 📄 deploy.sh          # AWS CodeDeploy deployment script (ECR pull, SSM env, container restart)
├── 📁 backend/
│   ├── 📄 .dockerignore      # Files ignored in backend Docker build context
│   ├── 📄 .env               # Active backend environment variables (local)
│   ├── 📄 .env.example       # Template for backend environment variables
│   ├── 📄 .gitignore          # Backend Git ignore rules
│   ├── 📄 Dockerfile         # Docker multi-stage build instructions (Node 18 Alpine)
│   ├── 📄 buildspec.yml      # AWS CodeBuild configuration for backend Docker image
│   ├── 📄 package.json       # Backend Node.js dependencies & scripts
│   ├── 📄 package-lock.json  # NPM dependency lockfile
│   ├── 📁 db/
│   │   ├── 📄 init_db.js     # Script to execute schema & seed migration on MySQL
│   │   ├── 📄 schema.sql     # Database tables DDL (users, claims, claim_items, etc.)
│   │   ├── 📄 seed.sql       # Initial reference data DML (roles, categories, demo users)
│   │   └── 📄 test_verify.js # Test script for database connection & query validation
│   └── 📁 src/
│       ├── 📄 server.js      # Express server entry point, CORS, and route mounting
│       ├── 📁 config/
│       │   └── 📄 db.js      # MySQL connection pool configuration (mysql2/promise)
│       ├── 📁 controllers/
│       │   ├── 📄 claimController.js  # Expense claim CRUD, status workflow & metrics
│       │   ├── 📄 lookupController.js # Categories and status reference data handlers
│       │   └── 📄 userController.js   # Auth (login/register) and user administration
│       ├── 📁 middleware/
│       │   └── 📄 authMiddleware.js   # JWT authentication & role-based access control
│       └── 📁 routes/
│           ├── 📄 claimRoutes.js  # `/api/claims` endpoint routes
│           ├── 📄 healthRoutes.js # `/health` endpoint for AWS/ALB health checks
│           ├── 📄 lookupRoutes.js # `/api/lookups` endpoint routes
│           └── 📄 userRoutes.js   # `/api/users` and `/api/auth` endpoint routes
└── 📁 frontend/
    ├── 📄 .env               # Active frontend environment variables (local)
    ├── 📄 .env.example       # Template for frontend environment variables
    ├── 📄 .gitignore          # Frontend Git ignore rules
    ├── 📄 README.md          # Frontend development quickstart guide
    ├── 📄 buildspec.yml      # AWS CodeBuild configuration for Vite static build
    ├── 📄 eslint.config.js   # ESLint code style and syntax rules
    ├── 📄 index.html         # Main HTML template & root DOM container
    ├── 📄 package.json       # Frontend React & Vite dependencies
    ├── 📄 package-lock.json  # NPM dependency lockfile
    ├── 📄 vite.config.js     # Vite bundler configuration
    ├── 📁 dist/              # Production compiled static web assets
    ├── 📁 public/            # Static public assets (favicons, icons)
    └── 📁 src/
        ├── 📄 main.jsx       # React application entry point (DOM render)
        ├── 📄 App.jsx        # Root component, routing logic & global application state
        ├── 📄 App.css        # Layout styles & component-specific CSS
        ├── 📄 index.css      # Design system, CSS variables & theme tokens
        ├── 📁 assets/        # Media assets, icons & graphics
        ├── 📁 components/
        │   ├── 📄 ClaimItemsBuilder.jsx # Dynamic form for adding claim item details
        │   ├── 📄 ClaimRow.jsx          # Reusable claim card/table row component
        │   └── 📄 Navbar.jsx            # Top navigation header with user info & logout
        ├── 📁 pages/
        │   ├── 📄 AdminPage.jsx     # System admin view (user management, payouts, metrics)
        │   ├── 📄 EmployeePage.jsx  # Employee dashboard (view & submit expense claims)
        │   ├── 📄 HomePage.jsx      # Role-based landing dashboard
        │   ├── 📄 LoginPage.jsx     # User authentication (Login & Register) interface
        │   ├── 📄 ManagerPage.jsx   # Manager review dashboard (approve/reject team claims)
        │   └── 📄 PendingPage.jsx   # Account holding page for pending approvals
        └── 📁 services/
            └── 📄 authService.js    # Axios HTTP client & backend API integrations
```

---

## 📊 Graphical System Architecture Diagram

```mermaid
graph TD
    subgraph Client ["Client Browser (Frontend)"]
        UI["React + Vite Single Page Application"]
        Navbar["Navbar Component"]
        Pages["Pages (Employee, Manager, Admin, Login)"]
        Axios["Axios API Client (authService.js)"]
        UI --> Navbar
        UI --> Pages
        Pages --> Axios
    end

    subgraph AWS_Infra ["AWS Deployment Infrastructure"]
        CodeDeploy["AWS CodeDeploy (appspec.yml)"]
        DeployScript["deploy.sh Script"]
        SSM["AWS SSM Parameter Store"]
        ECR["AWS ECR Container Registry"]
        CodeDeploy --> DeployScript
        DeployScript -->|Pull Image| ECR
        DeployScript -->|Fetch Envs| SSM
    end

    subgraph Backend_App ["Backend Server (Node.js / Express)"]
        Server["Express Server (server.js)"]
        AuthMiddleware["Auth Middleware (JWT & Roles)"]
        
        subgraph Controllers ["Controllers"]
            UserController["userController.js"]
            ClaimController["claimController.js"]
            LookupController["lookupController.js"]
        end
        
        subgraph Routes ["API Routes"]
            UserRoutes["/api/users"]
            ClaimRoutes["/api/claims"]
            LookupRoutes["/api/lookups"]
            HealthRoutes["/health"]
        end

        Server --> Routes
        Routes --> AuthMiddleware
        AuthMiddleware --> Controllers
    end

    subgraph Database ["MySQL Database"]
        DBPool["MySQL Pool (config/db.js)"]
        Tables[("MySQL Tables: users, claims, claim_items, roles, categories, claim_status_history")]
        DBPool --> Tables
    end

    Axios -->|HTTP / REST API| Server
    Controllers --> DBPool
```

---

## 🧩 Frontend Component & Routing Diagram

```mermaid
graph TD
    Main["main.jsx"] --> App["App.jsx (Router & User State)"]
    
    App --> Navbar["Navbar.jsx"]
    App --> Routes{"Role / Route Switch"}
    
    Routes -->|Unauthenticated| Login["LoginPage.jsx"]
    Routes -->|Pending Status| Pending["PendingPage.jsx"]
    Routes -->|Home Route| Home["HomePage.jsx"]
    Routes -->|Role: EMPLOYEE| Employee["EmployeePage.jsx"]
    Routes -->|Role: MANAGER| Manager["ManagerPage.jsx"]
    Routes -->|Role: ADMIN| Admin["AdminPage.jsx"]
    
    Employee --> ClaimRow["ClaimRow.jsx"]
    Employee --> ClaimBuilder["ClaimItemsBuilder.jsx"]
    
    Manager --> ClaimRow
    
    Admin --> ClaimRow
    
    Login & Employee & Manager & Admin --> AuthService["authService.js (Axios)"]
```

---

## 🔄 Backend API Request Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant Server as Express (server.js)
    participant Auth as Auth Middleware
    participant Route as Express Router
    participant Controller as Controller Logic
    participant DB as MySQL Pool

    Client->>Server: HTTP Request (e.g. POST /api/claims)
    Server->>Auth: Verify JWT Token & Role Authorization
    alt Token Invalid / Unauthorized
        Auth-->>Client: 401 Unauthorized / 403 Forbidden
    else Token Valid
        Auth->>Route: Pass to Claim Router
        Route->>Controller: Call claimController.createClaim()
        Controller->>DB: Execute SQL Query (INSERT INTO claims...)
        DB-->>Controller: Return Inserted Data / ID
        Controller-->>Client: 201 Created (JSON Response)
    end
```

---

## 📁 Detailed Directory & File Reference

### 1. Workspace Root Directory (`/`)
- `PROJECT_STRUCTURE.md`: Graphical structure diagrams, component hierarchy, and maintenance documentation.
- `appspec.yml`: AWS CodeDeploy deployment lifecycle specification.
- `docker-compose.yml`: Container orchestration setup for local/staging server and database.
- `scripts/deploy.sh`: Automated deployment script executing ECR container pull and SSM secret fetching.

### 2. Backend Subsystem (`/backend`)
- **`db/`**:
  - `schema.sql`: Table structure (Users, Roles, Categories, Claims, Claim Items, Audit History).
  - `seed.sql`: Data seeding script for initial setup and testing.
  - `init_db.js`: Execution script for schema creation and seeding.
  - `test_verify.js`: Verification test for DB connection and CRUD validation.
- **`src/`**:
  - `server.js`: Express server startup, CORS, middleware, and route mounting.
  - `config/db.js`: Database MySQL connection pool initialization.
  - `controllers/`: Business logic handlers (`claimController.js`, `userController.js`, `lookupController.js`).
  - `middleware/authMiddleware.js`: Token validation & role permission enforcement.
  - `routes/`: Express API route modules (`userRoutes.js`, `claimRoutes.js`, `lookupRoutes.js`, `healthRoutes.js`).

### 3. Frontend Subsystem (`/frontend`)
- **`src/components/`**:
  - `Navbar.jsx`: Header bar displaying user information and logout controls.
  - `ClaimRow.jsx`: Reusable claim card/table row component.
  - `ClaimItemsBuilder.jsx`: Form builder for itemized claim entries.
- **`src/pages/`**:
  - `LoginPage.jsx`: User authentication screen (Login & Register).
  - `EmployeePage.jsx`: Employee expense submission and tracking screen.
  - `ManagerPage.jsx`: Manager approval & rejection workflow screen.
  - `AdminPage.jsx`: System administration dashboard for user management & payouts.
  - `PendingPage.jsx`: Holding view for accounts awaiting admin approval.
  - `HomePage.jsx`: Role-based landing dashboard.
- **`src/services/`**:
  - `authService.js`: Centralized Axios client for backend API communication.

---

## 🔄 Maintenance & Update Guidelines

Whenever files or directories are added, renamed, or deleted in this project:
1. **Directory Tree**: Update the ASCII directory tree in Section 1.
2. **Mermaid Diagrams**: Update the architecture or component flow diagrams in Sections 2, 3, or 4 if components, routes, or workflows change.
3. **Reference Descriptions**: Update file descriptions in Section 5.
