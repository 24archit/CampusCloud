# 10-Minute Video Demonstration Script

## Project: Cloud-Based Smart Campus Resource Management System
**Total Target Duration:** 10 Minutes (600 Seconds)  
**Team Composition:** 3 Presenters  

---

### Segment 1: Introduction & Problem Context (0:00 – 2:00)
**Presenter: [STUDENT_1_NAME] (Frontend & Product Lead)**

- **[0:00 - 0:30] Screen: Title slide with college logo, project title, guide name, and 3 student details.**
  - *Spoken:* "Good morning respected professors and evaluators. Today, our team is presenting our Cloud Computing Capstone Project: The **Smart Campus Resource Management System**, architected and deployed on Amazon Web Services. I am [STUDENT_1_NAME], and alongside my teammates [STUDENT_2_NAME] and [STUDENT_3_NAME], we designed this solution to solve a critical campus challenge."

- **[0:30 - 1:15] Screen: Problem Statement & Existing Limitations Slide.**
  - *Spoken:* "Across colleges today, students share vital academic notes, past exam papers, and lab manuals through unstructured channels like WhatsApp groups or personal drive links. This causes link rot, zero cataloging, lack of access for future batches, and security issues. Our objective was to build a serverless, enterprise-grade cloud application where students and faculty can securely store, search, download, and share academic assets with high availability."

- **[1:15 - 2:00] Screen: Landing Page of CampusCloud live in browser.**
  - *Spoken:* "Here is the live deployed application. It features a modern, responsive design built with React, Vite, and TailwindCSS. Notice our clear feature highlights: Cloud Storage, Role-Based Authentication, Instant Sharing, and Global Content Delivery. Let's register a new student account to demonstrate the workflow."

---

### Segment 2: Student Experience & Core Features Demo (2:00 – 4:30)
**Presenter: [STUDENT_1_NAME]**

- **[2:00 - 2:45] Screen: Registration & Login Form.**
  - *Spoken:* "We sign up with full name, college email, and password. Real-time password strength validation ensures enterprise security standards. Once registered, a JWT session is initialized, routing us to the personalized Student Dashboard."

- **[2:45 - 3:30] Screen: Student Dashboard & Resource Upload.**
  - *Spoken:* "The dashboard displays real-time metrics: My Uploads, Downloads count, and Total Storage used. Let's upload a lecture resource. We navigate to the Upload page. We drag-and-drop a PDF document: *'Distributed Systems Architecture Notes'*. We choose Subject, Category as *'Notes'*, and add searchable tags."

- **[3:30 - 4:30] Screen: Upload progress bar & Direct S3 Presigned URL Execution in Network Tab.**
  - *Spoken:* "When I click 'Upload Resource', observe what happens behind the scenes in the browser's developer tools. The frontend calls our API Gateway to request an S3 Presigned URL, and then streams the file binary directly into an Amazon S3 private bucket. Notice that the backend Lambda never buffers the file! Once the upload finishes, resource metadata is recorded in DynamoDB, and we are redirected to the Resource Details page. We can download it with single-click signed URLs, or generate an ephemeral 72-hour share link."

---

### Segment 3: Backend Architecture & Cloud Microservices (4:30 – 7:00)
**Presenter: [STUDENT_2_NAME] (Backend & Cloud Architecture Lead)**

- **[4:30 - 5:15] Screen: High-Level AWS Architecture Diagram (Mermaid).**
  - *Spoken:* "Thank you, [STUDENT_1_NAME]. I am [STUDENT_2_NAME], and I will explain the backend serverless engine. Our entire system operates without running a single virtual machine. We selected a microservices architecture implemented on AWS Lambda using Node.js 20, exposed through Amazon API Gateway REST endpoints."

- **[5:15 - 6:00] Screen: API Gateway & Lambda Handler Code.**
  - *Spoken:* "Here are our modular handlers: `auth.js`, `resources.js`, `admin.js`, and `shared.js`. Each handler isolates business logic and follows the principle of single responsibility. All incoming requests pass through our JWT validation middleware, which authenticates the user and extracts role permissions."

- **[6:00 - 7:00] Screen: DynamoDB Tables & Global Secondary Indexes in AWS Console / Mock.**
  - *Spoken:* "For persistence, we chose Amazon DynamoDB, a fully managed NoSQL database. We defined three tables: `campus-cloud-users`, `campus-cloud-resources`, and `campus-cloud-shared-links`. Notice our Global Secondary Indexes on `uploaderId` and `category`—they allow sub-10ms query execution across thousands of items without expensive full table scans. Furthermore, for the shared links table, we enabled native DynamoDB Time-to-Live (TTL), meaning temporary links are automatically evicted by AWS without any cron job or background server."

---

### Segment 4: Cloud Infrastructure, Admin Controls & Conclusion (7:00 – 10:00)
**Presenter: [STUDENT_3_NAME] (DevOps, Infrastructure & Security Lead)**

- **[7:00 - 8:00] Screen: Admin Dashboard & Content Moderation Demo.**
  - *Spoken:* "Thank you, [STUDENT_2_NAME]. I am [STUDENT_3_NAME]. Let's examine the administrative oversight layer. Logging in with administrator privileges grants access to the Admin Dashboard. Here, administrators can monitor campus-wide storage utilization in megabytes and gigabytes, view total registered students, inspect upload velocity, and moderate or delete inappropriate content with instant cascading deletion across both DynamoDB and Amazon S3."

- **[8:00 - 8:50] Screen: AWS SAM `template.yaml` and CloudWatch Monitoring.**
  - *Spoken:* "Our infrastructure is 100% reproducible through Infrastructure as Code using AWS SAM. In `template.yaml`, we declare all IAM roles following the principle of least privilege: the Lambda function execution role can only read and write to designated table ARNs and the designated S3 bucket. All invocation metrics, latencies, and execution logs flow into Amazon CloudWatch for centralized monitoring."

- **[8:50 - 9:30] Screen: Test Execution Matrix & Automated CI/CD Workflow.**
  - *Spoken:* "We implemented rigorous automated testing: 13 test scenarios validating authentication edge cases, MIME type rejections, access control policies, and download count increments. Every commit triggers our GitHub Actions pipeline, which executes test suites before automated provisioning."

- **[9:30 - 10:00] Screen: Summary Slide with Thank You and Q&A Invitation.**
  - *Spoken:* "To conclude, the Smart Campus Resource Management System demonstrates how modern serverless cloud computing can solve real academic data management challenges with 99.9% availability, zero idle costs under AWS Free Tier, and instant scalability. We thank our guide [PROFESSOR_NAME] and the evaluators for their time. We are now open for viva questions."
