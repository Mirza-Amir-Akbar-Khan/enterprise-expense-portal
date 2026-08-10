# 🗺️ Project Structure & Architecture Overview

This document provides a visual and graphical overview of the project directory structure, component hierarchy, and AWS cloud architecture. **This file should be kept updated whenever new files, directories, or architectural components are added or modified.**

---

## 🌳 Directory Tree Visual

```
.
├── 📄 PROJECT_STRUCTURE.md            # Graphical project structure and documentation
├── 📄 appspec.yml                    # AWS CodeDeploy deployment hooks & specs
├── 📄 docker-compose.yml             # Docker container orchestration for local testing
├── 📁 scripts/
│   └── 📄 deploy.sh                  # AWS CodeDeploy deployment script (ECR pull, SSM env, DB init)
├── 📁 backend/
│   ├── 📄 .dockerignore              # Files ignored in backend Docker build context
│   ├── 📄 .env                       # Active backend environment variables (local)
│   ├── 📄 .env.example               # Template for backend environment variables
│   ├── 📄 .gitignore                  # Backend Git ignore rules
│   ├── 📄 Dockerfile                 # Docker multi-stage build instructions (Node 18 Alpine)
│   ├── 📄 buildspec.yml              # AWS CodeBuild configuration for backend Docker image
│   ├── 📄 package.json               # Backend Node.js dependencies & scripts
│   ├── 📄 package-lock.json          # NPM dependency lockfile
│   ├── 📁 db/
│   │   ├── 📄 init_db.js             # Script to execute schema & seed migration on MySQL
│   │   ├── 📄 schema.sql             # Database tables DDL (users, claims, claim_items, etc.)
│   │   ├── 📄 seed.sql               # Initial reference data DML (roles, categories, demo users)
│   │   └── 📄 test_verify.js         # Test script for database connection & query validation
│   └── 📁 src/
│       ├── 📄 server.js              # Express server entry point, CORS, and route mounting
│       ├── 📁 config/
│       │   └── 📄 db.js              # MySQL connection pool configuration (mysql2/promise)
│       ├── 📁 controllers/
│       │   ├── 📄 claimController.js  # Expense claim CRUD, status workflow & metrics
│       │   ├── 📄 lookupController.js # Categories and status reference data handlers
│       │   └── 📄 userController.js   # Auth (login/register) and user administration
│       ├── 📁 middleware/
│       │   └── 📄 authMiddleware.js   # JWT authentication & role-based access control
│       └── 📁 routes/
│           ├── 📄 claimRoutes.js      # `/api/claims` endpoint routes
│           ├── 📄 healthRoutes.js     # `/api/health` endpoint for AWS/ALB health checks
│           ├── 📄 lookupRoutes.js     # `/api/lookups` endpoint routes
│           └── 📄 userRoutes.js       # `/api/users` and `/api/auth` endpoint routes
├── 📁 frontend/
│   ├── 📄 .env                       # Active frontend environment variables (local)
│   ├── 📄 .env.example               # Template for frontend environment variables
│   ├── 📄 .gitignore                  # Frontend Git ignore rules
│   ├── 📄 README.md                  # Frontend development quickstart guide
│   ├── 📄 buildspec.yml              # AWS CodeBuild configuration for Vite static build
│   ├── 📄 eslint.config.js           # ESLint code style and syntax rules
│   ├── 📄 index.html                 # Main HTML template & root DOM container
│   ├── 📄 package.json               # Frontend React & Vite dependencies
│   ├── 📄 package-lock.json          # NPM dependency lockfile
│   ├── 📄 vite.config.js             # Vite bundler configuration
│   ├── 📁 public/                    # Static public assets (favicons, icons)
│   └── 📁 src/
│       ├── 📄 main.jsx               # React application entry point (DOM render)
│       ├── 📄 App.jsx                # Root component, routing logic & global state
│       ├── 📄 App.css                # Layout styles & component-specific CSS
│       ├── 📄 index.css              # Design system, CSS variables & theme tokens
│       ├── 📁 assets/                # Media assets, icons & graphics
│       ├── 📁 components/
│       │   ├── 📄 ClaimItemsBuilder.jsx # Dynamic form for adding claim item details
│       │   ├── 📄 ClaimRow.jsx          # Reusable claim card/table row component
│       │   └── 📄 Navbar.jsx            # Top navigation header with user info & logout
│       ├── 📁 pages/
│       │   ├── 📄 AdminPage.jsx         # System admin view (user management, payouts)
│       │   ├── 📄 EmployeePage.jsx      # Employee dashboard (view & submit claims)
│       │   ├── 📄 HomePage.jsx          # Role-based landing dashboard
│       │   ├── 📄 LoginPage.jsx         # User authentication (Login & Register)
│       │   ├── 📄 ManagerPage.jsx       # Manager review dashboard (approve/reject)
│       │   └── 📄 PendingPage.jsx       # Holding page for pending account approvals
│       └── 📁 services/
│           └── 📄 authService.js        # Axios HTTP client & backend API integrations
└── 📁 terraform/
    ├── 📄 PROGRESS.md                 # Infrastructure progress tracking log
    ├── 📁 environments/               # Target environment configurations
    │   └── 📁 dev/                    # Single Root Dev Environment Project
    │       ├── 📄 backend.tf          # S3 Remote state configuration
    │       ├── 📄 main.tf             # Root configuration instantiating all 12 modules
    │       ├── 📄 outputs.tf          # Stack outputs for dev environment
    │       └── 📄 variables.tf        # Dev environment variables
    └── 📁 modules/                    # Reusable infrastructure modules
        ├── 📁 alb/                    # Application Load Balancer & Target Groups
        ├── 📁 asg/                    # EC2 Launch Template & Auto Scaling Group
        ├── 📁 cicd/                   # Unified 7-Stage CodePipeline & CodeBuild module
        ├── 📁 cloudfront/             # CloudFront CDN (S3 + ALB origins, OAC, CORS)
        ├── 📁 codedeploy/             # CodeDeploy Application & Blue/Green DG
        ├── 📁 cognito/                # AWS Cognito User Pool & SPA Client
        ├── 📁 ecr/                    # AWS ECR repository for Docker images
        ├── 📁 elasticache/            # AWS ElastiCache Redis 7.1 cluster module
        ├── 📁 rds/                    # AWS RDS Aurora MySQL 8.0 Cluster module
        ├── 📁 security_groups/        # 3-Tier Security Group firewall chain
        ├── 📁 ssm_parameters/         # AWS SSM Parameter Store parameters
        └── 📁 vpc/                    # Multi-AZ VPC network module
```

---

## 🏛️ Full-Stack AWS Cloud Architecture Diagram

```
                                  [ CLIENT USER BROWSER ]
                                             │
                                             │ HTTPS Traffic
                                             v
                           +-----------------------------------+
                           |    AWS CLOUDFRONT CDN (OAC)       |
                           |  (CORS Elimination & SPA Routing) |
                           +----------------─┬─────────────────+
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      │ Static Assets                               │ API Requests (/api/*)
                      v                                             v
        +───────────────────────────+                 +───────────────────────────+
        |   AWS S3 FRONTEND BUCKET  |                 | APPLICATION LOAD BALANCER |
        |   (React SPA Static Web)  |                 |     (Public Subnets)      |
        +───────────────────────────+                 +─────────────┬─────────────+
                                                                    │
                                                                    │ Port 5000 (App-SG)
                                                                    v
+---------------------------------------------------------------------------------------------------+
|                                     VPC (10.0.0.0/16)                                             |
|                                                                                                   |
|   +---------------------------------------+       +---------------------------------------+       |
|   |    PRIVATE APP SUBNET 1 (us-west-2a)  |       |    PRIVATE APP SUBNET 2 (us-west-2b)  |       |
|   |                                       |       |                                       |       |
|   |  [ EC2 Instance 1 (AL2023) ]          |       |  [ EC2 Instance 2 (AL2023) ]          |       |
|   |  - Docker Container: backend-app      |       |  - Docker Container: backend-app      |       |
|   |  - CodeDeploy Agent                   |       |  - CodeDeploy Agent                   |       |
|   +----------------──┬────────────────────+       +───────────────────┬───────────────────+       |
|                      │                                                │                           |
|                      └────────────────────────┬───────────────────────┘                           |
|                                               │                                                   |
|                                               v                                                   |
|   +-------------------------------------------------------------------------------------------+   |
|   |                            PRIVATE DB SUBNETS (Multi-AZ)                                  |   |
|   |                                                                                           |   |
|   |    +------------------------------------+       +------------------------------------+    |   |
|   |    |    AMAZON AURORA MYSQL CLUSTER     |       |    AWS ELASTICACHE REDIS CLUSTER   |    |   |
|   |    |    - Node 1: Writer (db.t4g.medium) |       |    - Redis 7.1 (cache.t4g.micro)  |    |   |
|   |    |    - Node 2: Reader (db.t4g.medium) |       |    - Sub-ms In-Memory Caching      |    |   |
|   |    +------------------------------------+       +------------------------------------+    |   |
|   +-------------------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------------------+
                                                ^
                                                │ Configuration & Secrets
                                                │
                 +------------------------------┴────────────────────────------+
                 |                     AWS MANAGEMENT SERVICES                 |
                 |  - AWS SSM Parameter Store & KMS Encryption                 |
                 |  - AWS Cognito User Pool (Authentication & Authorization)   |
                 |  - AWS CodeDeploy (Zero-Downtime Blue/Green ASG Swap)       |
                 |  - AWS ECR (Docker Container Registry)                      |
                 +-------------------------------------------------------------+
```

---

## ⚙️ CI/CD Self-Mutating Pipeline Architecture

```
+-------------------------------------------------------------------------------+
| STAGE 1: SOURCE                                                               |
| GitHub Push ──> CodeStar Connection ──> Source Artifact (S3)                  |
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 2: TERRAFORM PLAN                                                       |
| CodeBuild: Runs `terraform plan` ──> Generates execution plan artifact `tfplan`|
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 3: MANUAL APPROVAL GATE                                                 |
| Pipeline Pauses for Engineering Review ──> Admin Approves via AWS Console/CLI |
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 4: TERRAFORM APPLY                                                      |
| CodeBuild: Runs `terraform apply` ──> Updates Cloud Infrastructure Dynamically |
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 5: BACKEND BUILD & PACKAGING                                            |
| CodeBuild: Builds Docker Image ──> Pushes to ECR ──> Outputs appspec/deploy.sh|
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 6: BACKEND BLUE/GREEN DEPLOYMENT                                        |
| AWS CodeDeploy: Clones ASG ──> Decrypts Secrets ──> Health Check ──> Reroutes |
+---------------------------------------┬---------------------------------------+
                                        │
                                        v
+-------------------------------------------------------------------------------+
| STAGE 7: FRONTEND BUILD & DEPLOY                                              |
| CodeBuild: Fetches SSM Config ──> Vite Build ──> S3 Upload ──> CDN Invalidation|
+-------------------------------------------------------------------------------+
```

---

## 🧩 Frontend Component & Routing Hierarchy

```
main.jsx
  │
  └── App.jsx (Router & Global User State)
        ├── Navbar.jsx (Header & User Logout Controls)
        │
        ├── Route Switch:
        │     ├── Unauthenticated  ---> LoginPage.jsx
        │     ├── Pending Status   ---> PendingPage.jsx
        │     ├── Role: EMPLOYEE   ---> EmployeePage.jsx
        │     │                          ├── ClaimRow.jsx
        │     │                          └── ClaimItemsBuilder.jsx
        │     ├── Role: MANAGER    ---> ManagerPage.jsx
        │     │                          └── ClaimRow.jsx
        │     └── Role: ADMIN      ---> AdminPage.jsx
        │                                └── ClaimRow.jsx
        │
        └── API Service Integration:
              └── authService.js (Axios Client -> CloudFront `/api/*` Endpoints)
```

---

## 🔄 Backend API Request Sequence Flow

```
1. Client (Frontend) ───────> GET /api/claims ──────> CloudFront CDN (OAC)
2. CloudFront CDN ──────────> ALB Listener ─────────> Target Group 1 (Port 5000)
3. Target Group ────────────> EC2 App Instance ─────> Express Server (server.js)
4. Express Server ──────────> Auth Middleware ──────> Validates Cognito JWT Token
5. Controller ──────────────> Redis Cache Check ────> [Hit]: Returns Instant JSON (<1ms)
                                                      [Miss]: Queries Aurora MySQL DB
6. Controller ──────────────> Client Response ──────> Returns 200 OK JSON Response
```

---

## 📁 Detailed Directory & File Reference

### 1. Workspace Root Directory (`/`)
- `PROJECT_STRUCTURE.md`: Visual structure diagrams, cloud architecture, and maintenance documentation.
- `appspec.yml`: AWS CodeDeploy deployment lifecycle specification.
- `docker-compose.yml`: Container orchestration setup for local development.
- `scripts/deploy.sh`: Automated deployment script executing ECR container pull, SSM secret fetching, and DB init.

### 2. Backend Subsystem (`/backend`)
- **`db/`**: `schema.sql`, `seed.sql`, `init_db.js`, `test_verify.js`.
- **`src/`**: `server.js`, `config/db.js`, `controllers/`, `middleware/authMiddleware.js`, `routes/`.

### 3. Frontend Subsystem (`/frontend`)
- **`src/components/`**: `Navbar.jsx`, `ClaimRow.jsx`, `ClaimItemsBuilder.jsx`.
- **`src/pages/`**: `LoginPage.jsx`, `EmployeePage.jsx`, `ManagerPage.jsx`, `AdminPage.jsx`, `PendingPage.jsx`, `HomePage.jsx`.
- **`src/services/`**: `authService.js`.

### 4. Terraform Subsystem (`/terraform`)
- **`environments/dev/`**: Dev environment configuration (`backend.tf`, `main.tf`, `variables.tf`, `outputs.tf`).
- **`modules/`**: Reusable modules:
  - `alb`: Application Load Balancer & Target Groups.
  - `asg`: EC2 Launch Template & Auto Scaling Group.
  - `cicd`: Unified 7-Stage self-mutating CodePipeline & CodeBuild module.
  - `cloudfront`: CloudFront CDN Distribution with OAC & CORS elimination.
  - `codedeploy`: CodeDeploy Application & Blue/Green Deployment Group.
  - `cognito`: AWS Cognito User Pool & SPA Web Client.
  - `ecr`: AWS ECR Docker Container Registry.
  - `elasticache`: AWS ElastiCache Redis 7.1 cluster module.
  - `rds`: AWS RDS Aurora MySQL 8.0 Cluster module.
  - `security_groups`: 3-Tier Security Group firewall chain (`ALB` ➔ `EC2` ➔ `DB`/`Redis`).
  - `ssm_parameters`: AWS SSM Parameter Store parameters.
  - `vpc`: Multi-AZ VPC network module (6 Subnets, IGW, 2x NAT Gateways).

---

## 🔄 Maintenance & Update Guidelines

Whenever files or directories are added, renamed, or deleted in this project:
1. **Directory Tree**: Update the ASCII directory tree in Section 1.
2. **AWS Architecture Diagram**: Update the ASCII architecture diagram in Section 2.
3. **Reference Descriptions**: Update file descriptions in Section 5.
