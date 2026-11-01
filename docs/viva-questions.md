# Comprehensive Viva Voce Questions & Answers
## Subject: Cloud Computing (CS801 / Academic Project Evaluation)
**Project Title:** Smart Campus Resource Management System

---

### Section 1: Cloud Computing Fundamentals

**Q1: What cloud deployment model and service models does this project utilize?**  
**A:** This project operates on a **Public Cloud deployment model** (Amazon Web Services). In terms of service models, it employs **Function-as-a-Service (FaaS / Serverless compute)** via AWS Lambda and **Platform/Software services** like Amazon DynamoDB (DBaaS), Amazon S3 (STaaS), and Amazon Cognito (IDaaS).

**Q2: What is the primary difference between serverless architecture and traditional virtual machine hosting?**  
**A:** In traditional hosting (e.g., AWS EC2), instances run 24/7, requiring manual capacity provisioning, OS patching, and paying for idle compute cycles. In serverless architecture (AWS Lambda), compute runs strictly in response to events, scales automatically from 0 to thousands of concurrent requests, and charges only for execution duration down to the millisecond.

**Q3: How does this project achieve High Availability (HA)?**  
**A:** High Availability is built into the managed services selected: Amazon S3 stores objects across a minimum of three Availability Zones (AZs) by default, offering 99.999999999% (11 9s) durability. DynamoDB replicates data synchronously across multiple AZs. CloudFront utilizes global edge locations for resilient static asset delivery.

**Q4: Explain Horizontal vs. Vertical Scaling in the context of this project.**  
**A:** Vertical scaling involves increasing CPU/RAM on a single machine. Horizontal scaling involves adding more compute instances. This project utilizes purely automatic horizontal scaling: AWS Lambda spins up concurrent execution environments as incoming API requests increase without any manual intervention.

---

### Section 2: AWS Services & Implementation

**Q5: Why did you use Amazon S3 Presigned URLs instead of uploading files through Lambda?**  
**A:** Direct S3 presigned URLs eliminate the compute and memory bottleneck of streaming multi-megabyte payloads through Lambda and API Gateway. AWS Lambda has a 6MB payload limit for synchronous invocations and charges for execution time. By uploading directly to S3 via presigned URLs, the client streams binary data straight into object storage at wire speed with zero compute overhead on Lambda.

**Q6: What is Amazon DynamoDB, and why choose it over an SQL database like MySQL or PostgreSQL?**  
**A:** Amazon DynamoDB is a fully managed, serverless NoSQL key-value and document database designed for single-digit millisecond latency at any scale. We chose DynamoDB because academic resource metadata access patterns are predictable (lookup by resource ID, query by uploader, or filter by category). DynamoDB scales automatically without connection pooling or database instance management overhead.

**Q7: How is DynamoDB's Time-To-Live (TTL) feature used in this project?**  
**A:** In the `campus-cloud-shared-links` table, each temporary share record includes an epoch timestamp in the `ttl` attribute (current time + 72 hours). DynamoDB's background engine automatically deletes expired records within 48 hours without consuming read/write capacity or requiring scheduled cron scripts.

**Q8: What is the role of Amazon API Gateway in this project?**  
**A:** Amazon API Gateway acts as the secure entry point ("front door") for all backend requests. It routes HTTP paths and methods to specific Lambda handlers, handles Cross-Origin Resource Sharing (CORS) preflight requests, validates payloads, and terminates SSL/TLS certificates.

**Q9: How is Amazon CloudFront used in conjunction with S3?**  
**A:** CloudFront acts as a Content Delivery Network (CDN) that caches the static frontend single-page application (HTML, CSS, JavaScript) at Edge Locations geographically close to end users. This minimizes latency and protects the origin S3 bucket by restricting direct public access via Origin Access Control (OAC).

---

### Section 3: Security & Identity Access Management (IAM)

**Q10: Explain the Principle of Least Privilege as implemented in your IAM policies.**  
**A:** Each AWS Lambda function runs with an execution role that grants access solely to the exact resources it requires. For example, the `campus-cloud-lambda-role` is restricted to specific DynamoDB table ARNs (`campus-cloud-users`, `campus-cloud-resources`) and the designated S3 bucket ARN, rather than broad wildcard permissions (`*`).

**Q11: How is user authentication and authorization handled?**  
**A:** User authentication uses JSON Web Tokens (JWT). Upon successful login, the server issues a signed JWT containing user claims (`userId`, `email`, `role`). Subsequent requests pass this token in the `Authorization: Bearer <token>` header. Middleware decrypts and validates the token signature, enforcing Role-Based Access Control (RBAC) so that administrative routes (e.g., `/admin/*`) reject non-admin users with an HTTP 403 Forbidden.

**Q12: Where are sensitive credentials stored?**  
**A:** Zero secrets or AWS credentials exist in client-side code or public version control. The application utilizes AWS IAM roles for service-to-service authentication. Local development secrets are stored in `.env` files that are strictly excluded via `.gitignore`.

---

### Section 4: Architecture, Testing & Cost

**Q13: What happens if two students upload files with the exact same name?**  
**A:** In the S3 ingestion service, files are stored under keys structured as `resources/{userId}/{uuid}-{sanitizedFilename}`. Because every upload generates a unique Version 4 UUID prefix, collisions are statistically impossible and files never overwrite each other.

**Q14: What is Infrastructure as Code (IaC) and how did you implement it?**  
**A:** Infrastructure as Code is the practice of defining cloud infrastructure in declarative configuration files rather than manual point-and-click console configuration. We implemented this using AWS Serverless Application Model (SAM) in `infrastructure/template.yaml`, allowing our complete cloud infrastructure (Cognito, DynamoDB, S3, Lambda, API Gateway) to be deployed with a single command (`sam deploy`).

**Q15: What is the monthly operating cost of this application?**  
**A:** For typical collegiate usage (up to thousands of monthly requests and tens of gigabytes of storage), the operating cost is **$0.00**. AWS Lambda offers 1,000,000 free requests per month, DynamoDB offers 25 GB of free storage under the AWS Free Tier, and S3 offers 5 GB of standard storage.
