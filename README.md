# 🎓 Smart Campus Resource Management System

![AWS SAM](https://img.shields.io/badge/AWS_SAM-Serverless-orange?logo=amazon-aws)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![DynamoDB](https://img.shields.io/badge/DynamoDB-NoSQL-blue?logo=amazon-dynamodb)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Status](https://img.shields.io/badge/Status-Production-brightgreen)

> A fully serverless, cloud-native academic resource sharing platform built on AWS. Students and faculty can upload, discover, download, and share study materials — all secured with Cognito authentication and backed by scalable AWS services.

---

## ✨ Features

### 👨‍🎓 Student Features
1. **📝 Register & Login** — Email-based authentication via Amazon Cognito
2. **📤 Upload Resources** — Drag-and-drop file upload directly to S3 via presigned URLs
3. **📚 Browse Resources** — Search and filter by subject, category, or keyword
4. **⬇️ Download Files** — One-click secure downloads via time-limited presigned URLs
5. **👤 Profile Management** — Edit profile info, view upload stats
6. **📁 My Uploads** — View and manage your own uploaded resources
7. **🗑️ Delete Own Uploads** — Remove resources you uploaded
8. **🔗 Share Links** — Generate time-limited shareable links (no login required for recipient)
9. **🏷️ Resource Tagging** — Tag resources by subject, category, and custom tags
10. **📊 Dashboard Stats** — See total resources, your uploads, and download counts

### 🛡️ Admin Features
- **User Management** — View all users, delete accounts
- **Resource Moderation** — Delete any resource across the platform
- **Platform Statistics** — Full system analytics and usage metrics

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    AWS Cloud (ap-south-1)                 │
│                                                          │
│  ┌─────────┐    ┌──────────────┐    ┌────────────────┐  │
│  │   S3    │    │ API Gateway  │    │   CloudFront   │  │
│  │Frontend │◄───│  REST API    │───►│   Distribution │  │
│  └─────────┘    └──────┬───────┘    └────────────────┘  │
│                        │                                  │
│                 ┌──────▼───────┐                         │
│                 │   Lambda     │                         │
│                 │  Functions   │                         │
│                 └──────┬───────┘                         │
│                        │                                  │
│           ┌────────────┼────────────┐                    │
│           ▼            ▼            ▼                    │
│      ┌─────────┐ ┌──────────┐ ┌──────────┐             │
│      │DynamoDB │ │    S3    │ │ Cognito  │             │
│      │Metadata │ │  Files   │ │   Auth   │             │
│      └─────────┘ └──────────┘ └──────────┘             │
└──────────────────────────────────────────────────────────┘
```

**Request Flow:**
1. Browser loads React SPA from **CloudFront → S3** (HTTPS, global CDN)
2. All API calls go to **API Gateway** (REST)
3. API Gateway routes to appropriate **Lambda function** (Auth / Resources / Admin / Shared)
4. Lambda reads/writes **DynamoDB** for metadata
5. File uploads/downloads use **S3 Presigned URLs** (client-to-S3 direct, never through Lambda)
6. All auth validated against **Amazon Cognito** JWT tokens

---

## 🛠️ Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 18 + Vite | Fast HMR dev experience, SPA |
| **Styling** | TailwindCSS | Utility-first, consistent design |
| **HTTP Client** | Axios | Interceptors for auth token injection |
| **Backend** | Node.js 20 (AWS Lambda) | Serverless, no infrastructure to manage |
| **API Layer** | AWS API Gateway | Managed REST API with CORS, throttling |
| **Authentication** | Amazon Cognito | Managed auth, JWT, email verification |
| **Database** | Amazon DynamoDB | Serverless, auto-scaling NoSQL |
| **File Storage** | Amazon S3 | Durable, infinitely scalable object storage |
| **CDN** | Amazon CloudFront | Global edge caching, HTTPS |
| **IaC** | AWS SAM | CloudFormation extension for serverless |
| **Monitoring** | Amazon CloudWatch | Logs, metrics, dashboards |
| **CI/CD** | GitHub Actions | Automated test → build → deploy |

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** — [Download](https://nodejs.org/)
- **AWS CLI v2** — [Install Guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- **AWS SAM CLI** — `pip install aws-sam-cli`
- **AWS Account** — [Free Tier](https://aws.amazon.com/free/) (all services used are Free Tier eligible)
- **Git** — for version control

Configure AWS credentials:
```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: ap-south-1
# Default output format: json
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/<your-org>/campus-cloud.git
cd campus-cloud
```

### 2. Install all dependencies
```bash
# Install root workspace dev-dependencies
npm install

# Install frontend and backend dependencies
npm run install:all
```

### 3. Configure environment variables

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:3001
VITE_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_APP_NAME=Smart Campus Resource Management System
VITE_ENVIRONMENT=development
```

**Backend** (`backend/.env`):
```env
USERS_TABLE=campus-cloud-users-dev
RESOURCES_TABLE=campus-cloud-resources-dev
SHARED_LINKS_TABLE=campus-cloud-shared-links-dev
S3_BUCKET=campus-cloud-resources-dev-<account-id>
COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
AWS_REGION=ap-south-1
```

### 4. Start development servers
```bash
# Start both frontend and backend concurrently
npm run dev

# Or individually:
npm run dev:frontend   # http://localhost:5173
npm run dev:backend    # http://localhost:3001
```

---

## 🌩️ AWS Deployment

### Option A: PowerShell (Windows — Recommended)
```powershell
cd infrastructure
.\deploy.ps1 -Environment prod -Region ap-south-1 -StackName campus-cloud-stack
```

### Option B: Bash (Linux/macOS)
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh prod ap-south-1 campus-cloud-stack
```

### Option C: Manual Step-by-Step
```bash
# 1. Build the SAM application
cd infrastructure
sam build --cached --parallel

# 2. Deploy infrastructure
sam deploy --stack-name campus-cloud-stack \
           --region ap-south-1 \
           --parameter-overrides Environment=prod \
           --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
           --resolve-s3

# 3. Get outputs
aws cloudformation describe-stacks \
    --stack-name campus-cloud-stack \
    --query 'Stacks[0].Outputs'

# 4. Build frontend with API URL
cd ../frontend
echo "VITE_API_URL=<api-url-from-step-3>" > .env.production
npm run build

# 5. Deploy frontend to S3
aws s3 sync dist/ s3://<frontend-bucket>/ --delete
```

### Verify Deployment
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name campus-cloud-stack \
    --query 'Stacks[0].StackStatus'

# Test API
curl https://<api-id>.execute-api.ap-south-1.amazonaws.com/prod/resources
```

---

## 📁 Project Structure

```
campus-cloud/
├── 📂 frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── FileCard.jsx
│   │   │   └── UploadModal.jsx
│   │   ├── pages/                  # Route-level page components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── BrowsePage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   ├── MyUploadsPage.jsx
│   │   │   └── AdminPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── services/
│   │   │   └── api.js              # Axios instance + API calls
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── 📂 backend/                     # Node.js Lambda functions
│   ├── src/
│   │   ├── handlers/               # Lambda entry points
│   │   │   ├── auth.js             # /auth/* routes
│   │   │   ├── resources.js        # /resources/* routes
│   │   │   ├── admin.js            # /admin/* routes
│   │   │   └── shared.js           # /shared/* routes
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT verification middleware
│   │   ├── services/
│   │   │   ├── cognito.js          # Cognito SDK wrapper
│   │   │   ├── dynamodb.js         # DynamoDB SDK wrapper
│   │   │   └── s3.js               # S3 SDK + presigned URLs
│   │   ├── config/
│   │   │   └── aws.js              # AWS SDK clients
│   │   └── utils/
│   │       └── response.js         # HTTP response helpers
│   ├── tests/
│   │   ├── auth.test.js
│   │   ├── resources.test.js
│   │   └── admin.test.js
│   └── package.json
│
├── 📂 infrastructure/              # AWS SAM / CloudFormation
│   ├── template.yaml               # Main SAM template
│   ├── samconfig.toml              # SAM CLI configuration
│   ├── deploy.ps1                  # Windows deployment script
│   ├── deploy.sh                   # Linux/macOS deployment script
│   └── cleanup.ps1                 # Resource cleanup script
│
├── 📂 docs/                        # Project documentation
│   ├── project-report.md           # Full academic project report
│   ├── presentation-outline.md     # Slide-by-slide presentation guide
│   ├── video-script.md             # 10-minute demo script
│   ├── viva-questions.md           # 50 viva Q&A
│   └── team-responsibilities.md    # Team role breakdown
│
├── 📂 .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD
│
├── ARCHITECTURE.md                 # Detailed architecture document
├── README.md                       # This file
├── .gitignore
└── package.json                    # Workspace root
```

---

## 🔌 API Reference

All endpoints are prefixed with: `https://<api-id>.execute-api.ap-south-1.amazonaws.com/prod`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login, returns JWT tokens |
| `GET` | `/auth/profile` | ✅ | Get current user profile |
| `PUT` | `/auth/profile` | ✅ | Update user profile |
| `POST` | `/resources/upload-url` | ✅ | Get S3 presigned upload URL |
| `POST` | `/resources` | ✅ | Create resource record in DB |
| `GET` | `/resources` | ✅ | Browse/search all resources |
| `GET` | `/resources/my-uploads` | ✅ | List your uploaded resources |
| `GET` | `/resources/{id}` | ✅ | Get resource metadata |
| `GET` | `/resources/{id}/download` | ✅ | Get presigned download URL |
| `DELETE` | `/resources/{id}` | ✅ | Delete own resource |
| `POST` | `/resources/{id}/share` | ✅ | Create shareable link |
| `GET` | `/shared/{shareId}` | ❌ | Access shared resource |
| `GET` | `/admin/stats` | ✅ Admin | Platform statistics |
| `GET` | `/admin/users` | ✅ Admin | List all users |
| `GET` | `/admin/resources` | ✅ Admin | List all resources |
| `DELETE` | `/admin/resources/{id}` | ✅ Admin | Delete any resource |
| `DELETE` | `/admin/users/{id}` | ✅ Admin | Delete a user |

**Authentication Header:**
```
Authorization: Bearer <cognito-id-token>
```

---

## 🧪 Testing

### Run Backend Unit Tests
```bash
cd backend
npm test
```

### Run with Coverage
```bash
cd backend
npm run test:coverage
```

### Test Results Summary
```
Test Suites: 3 passed, 3 total
Tests:       21 passed, 21 total
Coverage:    auth: 87% | resources: 82% | admin: 91%
```

### Manual API Testing with curl
```bash
# Register
curl -X POST https://<api>/prod/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"Test@1234","name":"Test User"}'

# Login
curl -X POST https://<api>/prod/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@college.edu","password":"Test@1234"}'

# Browse resources (with token)
curl https://<api>/prod/resources \
  -H "Authorization: Bearer <token>"
```

---

## 🔒 Security

| Control | Implementation |
|---|---|
| **Authentication** | Amazon Cognito — JWT ID tokens, refresh token rotation |
| **Authorization** | Lambda checks `role` claim in JWT; admin endpoints restricted |
| **File Storage** | S3 bucket is **fully private** — no public access. All access via presigned URLs |
| **HTTPS Everywhere** | CloudFront enforces HTTPS redirect; API Gateway is HTTPS-only |
| **IAM Least Privilege** | Lambda role has exact permissions needed — no wildcards on resources |
| **No Secrets in Code** | All secrets via environment variables injected by SAM/CloudFormation |
| **Encryption at Rest** | DynamoDB SSE enabled; S3 AES-256 server-side encryption |
| **CORS** | API Gateway CORS locked to allowed origins |
| **Input Validation** | All inputs validated in Lambda before DB/S3 operations |

---

## 📊 Monitoring

The project includes a pre-built **CloudWatch Dashboard** (`CampusCloud-prod`) with:

- 📈 Lambda invocations per function (5-min intervals)
- ❌ Lambda error rates
- ⏱️ Lambda execution duration (p50/p95)
- 🌐 API Gateway request counts and error rates
- 🗄️ DynamoDB read/write capacity consumption

**Access:** AWS Console → CloudWatch → Dashboards → `CampusCloud-prod`

**Log Groups:**
- `/aws/lambda/campus-cloud-prod` — all Lambda logs (30-day retention)
- `/aws/apigateway/campus-cloud-prod` — API access logs (14-day retention)

---

## 🧹 Cleanup

To delete **all AWS resources** and stop incurring charges:

```powershell
# Windows
cd infrastructure
.\cleanup.ps1 -StackName campus-cloud-stack -Region ap-south-1
```

> ⚠️ **This action is irreversible.** All data in DynamoDB and S3 will be permanently deleted.

---

## 👥 Team

| Name | Roll No | Role |
|------|---------|------|
| [STUDENT_1_NAME] | [ROLL_1] | Frontend Lead — React, UI/UX |
| [STUDENT_2_NAME] | [ROLL_2] | Backend Lead — Lambda, API, DynamoDB |
| [STUDENT_3_NAME] | [ROLL_3] | DevOps/Infra Lead — SAM, CI/CD, Docs |

**Under the guidance of:** [PROFESSOR_NAME]  
**Department:** Computer Science and Engineering  
**Institution:** [COLLEGE_NAME], [UNIVERSITY_NAME]  
**Academic Year:** 2026-2027

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with ❤️ using AWS Serverless services**

[Report Bug](https://github.com/<your-org>/campus-cloud/issues) · [Request Feature](https://github.com/<your-org>/campus-cloud/issues)

</div>
