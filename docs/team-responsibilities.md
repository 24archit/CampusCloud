# Team Responsibilities & Work Division
## Academic Capstone Project: Smart Campus Resource Management System

---

## Member 1: [STUDENT_1_NAME] (Roll No: [ROLL_1])
### Role: Frontend Architecture & UI/UX Lead

#### Technical Contributions:
- Initialized and structured the React 18 + Vite Single Page Application.
- Configured TailwindCSS design system with custom brand color palettes and typography.
- Implemented all 12 responsive frontend views:
  - Landing page with dynamic SaaS presentation, feature grids, and statistical callouts.
  - Authentication portal (Sign In and Registration with real-time password strength validation).
  - Student Dashboard featuring upload statistics, storage meter, and quick-action cards.
  - Resource Catalog with search debouncing, category tags, and file-type filters.
  - Detailed Resource view with presigned download initiation and copyable 72-hour share modals.
  - Drag-and-drop file upload engine with real-time progress tracking and MIME-type validation.
  - My Uploads management interface with list/grid toggle views.
  - Profile and user settings editor.
- Built unified Axios HTTP client with request/response interceptors for JWT injection and 401 redirect handling.

#### Presentation & Viva Responsibilities:
- Presentation Segment: Introduction, Problem Statement, and Core Application Demonstration (0:00 - 4:30).
- Primary Viva Focus: Client-side routing, Direct S3 client streaming, User experience design, Form validation, and SPA performance optimization.

---

## Member 2: [STUDENT_2_NAME] (Roll No: [ROLL_2])
### Role: Backend Cloud Architecture & Microservices Lead

#### Technical Contributions:
- Architected the serverless microservice handlers using Node.js 20 on AWS Lambda.
- Implemented core backend handlers:
  - `auth.js`: User registration, PBKDF2 password hashing, login verification, and JWT issuance.
  - `resources.js`: Presigned S3 PUT/GET URL generation, metadata CRUD, search query parsing, and download tracking.
  - `shared.js`: Public ephemeral resource retrieval with TTL expiration checks.
  - `admin.js`: Cross-table administrative metrics aggregation, user moderation, and cascading deletion.
- Designed Amazon DynamoDB table schemas, Primary Keys, and Global Secondary Indexes (`EmailIndex`, `UploaderIndex`, `CategoryIndex`).
- Configured Amazon API Gateway REST endpoints with CORS policies and error status mappings.
- Implemented local Express emulation server (`local-dev/server.js`) for rapid offline testing.

#### Presentation & Viva Responsibilities:
- Presentation Segment: Backend Serverless Architecture, API Gateway routing, and DynamoDB Schema Design (4:30 - 7:00).
- Primary Viva Focus: REST API contracts, Event-driven architecture, DynamoDB single-digit millisecond latency vs. Relational databases, and Presigned URL security.

---

## Member 3: [STUDENT_3_NAME] (Roll No: [ROLL_3])
### Role: Cloud Infrastructure, DevOps & Security Lead

#### Technical Contributions:
- Authored the AWS Serverless Application Model (SAM) declarative template (`infrastructure/template.yaml`).
- Configured CloudFormation resources for:
  - Amazon S3 private storage buckets with lifecycle policies and strict Public Access Blocks.
  - Amazon CloudFront Content Delivery Network with Origin Access Control (OAC).
  - Amazon Cognito User Pool and App Client for identity management.
  - AWS IAM execution roles enforcing least-privilege security policies.
  - Amazon CloudWatch dashboard for invocation telemetry, error alarms, and latency profiling.
- Automated local and cross-platform deployment workflows (`deploy.ps1`, `cleanup.ps1`).
- Implemented GitHub Actions CI/CD pipeline (`.github/workflows/deploy.yml`) for continuous automated testing and deployment.
- Authored the project technical documentation, comprehensive project report, and testing suite.

#### Presentation & Viva Responsibilities:
- Presentation Segment: Cloud Infrastructure, Security, IAM Policies, and CloudWatch Monitoring (7:00 - 10:00).
- Primary Viva Focus: Infrastructure as Code (IaC), IAM least-privilege architecture, CloudWatch observability, Disaster recovery, High Availability, and AWS Free Tier cost optimization.
