# Cloud Presentation Slides: Smart Campus Resource Management System
**Course:** Cloud Computing Project Evaluation (2026-2027)  
**Platform:** Amazon Web Services (AWS)  
**Team Members:** [STUDENT_1_NAME] | [STUDENT_2_NAME] | [STUDENT_3_NAME]  
**Supervisor:** [PROFESSOR_NAME]  

---

### Slide 1: Title & Introduction
- **Title:** Smart Campus Resource Management System (CampusCloud)
- **Tagline:** A Serverless, Cloud-Native Academic Asset Sharing & Discovery Platform
- **Presenters:** 
  - [STUDENT_1_NAME] (Frontend & UI/UX Lead)
  - [STUDENT_2_NAME] (Backend & Cloud Architecture Lead)
  - [STUDENT_3_NAME] (DevOps, Infrastructure & Security Lead)
- **Institution:** Department of Computer Science & Engineering, [COLLEGE_NAME]

---

### Slide 2: Problem Statement
- **Current Challenges on Campus:**
  - Fragmented sharing across temporary channels (WhatsApp, Telegram, email).
  - Unindexed files: inability to search by Subject, Department, or Year.
  - Link rot: expired personal Google Drive permissions.
  - Lack of versioning and zero administrative content moderation.
- **Goal:** Build an enterprise-grade, serverless portal where academic materials are cataloged, searchable, highly available, and secure.

---

### Slide 3: Key Objectives
- **Zero Server Management:** Pure serverless architecture using AWS Lambda and Amazon API Gateway.
- **Direct S3 Ingestion:** Client-side multi-part uploads via presigned URLs to bypass compute bottlenecks.
- **High-Performance Metadata Querying:** Sub-10ms response times powered by Amazon DynamoDB GSIs.
- **Secure Ephemeral Sharing:** Native Time-To-Live (TTL) automated link expiration.
- **Cost Minimization:** 100% Free-Tier compliant ($0 monthly infrastructure expense).

---

### Slide 4: System Architecture
- **Presentation Layer:** React 18 SPA + Vite + TailwindCSS served via Amazon CloudFront from S3.
- **API & Compute Layer:** Amazon API Gateway + AWS Lambda (Node.js 20).
- **Data & Object Layer:** Amazon DynamoDB (Users, Resources, SharedLinks) + Amazon S3 (Documents).
- **Auth & Observability:** Amazon Cognito / JWT + Amazon CloudWatch Logs & Metrics.

---

### Slide 5: Frontend Design & User Experience
- **Responsive SaaS UI:** Mobile-first design with clean dark-mode aesthetics.
- **Key Views:**
  - Interactive Dashboard with real-time analytics.
  - Dynamic Catalog with debounced search, category pills, and file-type badges.
  - Drag-and-drop file uploader with progress tracking.
  - Dedicated Admin Console for user and file management.

---

### Slide 6: Direct Storage Ingestion (S3 Presigned URLs)
- **Traditional Monolithic Flow:** Client ➔ Web Server RAM ➔ Cloud Storage *(Slow, memory intensive, server crashes)*.
- **Our Cloud-Native Flow:**
  1. Client requests presigned PUT URL from Lambda.
  2. Lambda validates permissions and generates signed URL.
  3. Client streams file directly to S3 via HTTP PUT.
  4. Lambda records metadata in DynamoDB.
- **Benefit:** Infinite horizontal scalability; uploads up to 50MB execute at wire speed without consuming Lambda memory.

---

### Slide 7: Database Architecture (Amazon DynamoDB)
- **Tables Designed:**
  - `campus-cloud-users`: Primary Key `userId`, GSI on `email`.
  - `campus-cloud-resources`: Primary Key `resourceId`, GSI on `uploaderId` and `category`.
  - `campus-cloud-shared-links`: Primary Key `shareId`, TTL enabled on `ttl` attribute.
- **Why DynamoDB?** On-demand capacity, single-digit millisecond reads/writes, zero connection pooling overhead.

---

### Slide 8: Security & Access Control
- **Authentication:** Stateless JSON Web Tokens (JWT) / Amazon Cognito.
- **Role-Based Access Control (RBAC):** Distinct `student` and `admin` permission scopes.
- **IAM Least Privilege:** Lambda execution roles scoped down to exact table and bucket ARNs.
- **S3 Bucket Hardening:** Public Access Blocked; all access governed through signed cryptographic URLs.

---

### Slide 9: DevOps & Infrastructure as Code (IaC)
- **AWS Serverless Application Model (SAM):**
  - Entire cloud stack declared in `infrastructure/template.yaml`.
  - Single-command automated deployments (`sam deploy`).
- **CI/CD Pipeline:** GitHub Actions automatically tests code and provisions resources on push.

---

### Slide 10: Testing & Results
- **Automated Test Matrix:** 13 verified test suites covering auth, file uploads, permissions, and admin tools.
- **Performance Benchmarks:**
  - Average API response time: < 85 ms.
  - Global asset delivery via CloudFront edge locations.
  - Zero downtime during burst traffic simulations.

---

### Slide 11: Conclusion & Future Scope
- **Conclusion:** Successfully built a production-quality, serverless cloud platform solving academic resource sharing with high availability and zero server management overhead.
- **Future Enhancements:**
  - AI-powered document summarization using Amazon Bedrock / Gemini API.
  - OCR extraction for handwritten notes using Amazon Textract.
  - Full-text document search powered by Amazon OpenSearch.
