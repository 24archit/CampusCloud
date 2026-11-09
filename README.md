# 🎓 CampusCloud — Smart Campus Resource Management System

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://campuscloud-udrm.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen)](#)

> **CampusCloud** is an academic resource sharing and discovery platform designed for university students and faculty. The application provides centralized, cataloged, and secure access to lecture notes, past exam papers, assignments, and reference materials.

**Live Deployment:**
- **Frontend Application:** Deployed on **Vercel**
- **Backend API Service:** [`https://campuscloud-udrm.onrender.com`](https://campuscloud-udrm.onrender.com) (Node.js 20 Web Service on Render)
- **Alternative Cloud Target:** AWS Serverless (SAM template included for AWS Lambda, DynamoDB, S3, API Gateway)

---

## 📌 Problem Statement

In academic institutions, students and faculty frequently exchange lecture notes, past exam papers, syllabus copies, and lab manuals across unstructured channels (WhatsApp groups, Telegram channels, and personal drive links). This approach suffers from:
1. **Link Rot & File Loss:** Drive links frequently expire or have restricted permissions when students graduate.
2. **Poor Discoverability:** Unindexed files cannot be searched systematically by Subject, Department, Semester, or Resource Type.
3. **No Moderation:** Zero administrative controls or quality checks for inappropriate or duplicate content.
4. **Bandwidth Inefficiencies:** Uploading large files through compute servers causes bottlenecks and high operating costs.

**CampusCloud** solves these challenges by providing a dedicated, cloud-hosted academic portal with role-based access control, direct storage streaming, robust search, and ephemeral sharing.

---

## ✨ Key Features

### 👨‍🎓 Student & Faculty Experience
- **📝 User Authentication** — Secure email registration and login with JWT session management.
- **📤 Direct File Upload** — Drag-and-drop file upload for PDFs, presentations, documents, and archives.
- **📚 Search & Discovery** — Instant search debouncing with filters for Subject, Category (Notes, Question Papers, Lab Manuals), and Tags.
- **⬇️ Secure Downloads** — Direct, authorized downloads of original academic materials.
- **🔗 Ephemeral Sharing** — Generate 72-hour temporary sharing links accessible without requiring login.
- **📁 My Uploads Manager** — Track personal uploads, view download counters, and delete owned materials.
- **👤 Profile Management** — Customize user information and inspect personal storage metrics.

### 🛡️ Administrative Console
- **Platform Analytics** — Monitor total registered users, uploaded resources, cumulative downloads, and storage consumption.
- **User Management** — View all registered accounts and perform account moderation.
- **Content Moderation** — Review and remove outdated or non-compliant academic materials across the platform.

---

## 🏗️ System Architecture

CampusCloud is architected as a decoupled, cloud-hosted web application:

```
┌─────────────────────────────────┐           HTTPS / REST API           ┌────────────────────────────────┐
│         Vercel (Edge)           │ ───────────────────────────────────> │         Render (PaaS)          │
│                                 │                                      │                                │
│  - React 18 + Vite SPA          │ <─────────────────────────────────── │  - Node.js 20 Web Service      │
│  - TailwindCSS Design System    │            JSON Responses            │  - REST Handler Adapters       │
│  - Client Routing & UI State    │                                      │  - JWT Auth & CORS Middleware  │
│  - Axios HTTP Interceptors      │                                      │  - JSON DB / DynamoDB Service  │
└─────────────────────────────────┘                                      │  - Local Uploads / S3 Storage  │
                                                                         └────────────────────────────────┘
                                                                                         │
                                         ┌───────────────────────────────────────────────┴────────┐
                                         │ (Optional AWS Cloud Backing via template.yaml)         │
                                         ▼                         ▼                              ▼
                                  ┌─────────────┐           ┌──────────────┐              ┌───────────────┐
                                  │  DynamoDB   │           │  Amazon S3   │              │ Amazon Cognito│
                                  │  Metadata   │           │ Object Store │              │ Auth Service  │
                                  └─────────────┘           └──────────────┘              └───────────────┘
```

For complete technical specifications, see [ARCHITECTURE.md](ARCHITECTURE.md) and [FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md).

---

## 🛠️ Technology Stack

| Layer | Actual Deployment Technology | Optional / Cloud-Native Alternative | Purpose |
|---|---|---|---|
| **Frontend** | React 18 + Vite | Amazon S3 + CloudFront | Responsive Single Page Application (SPA) |
| **Frontend Hosting** | **Vercel** | AWS CloudFront CDN | Global edge deployment with automatic SSL |
| **Styling** | TailwindCSS 3.4 | — | Utility-first responsive styling and dark mode |
| **Backend API** | Node.js 20 + Express Engine | AWS Lambda Functions | REST API handlers & business logic |
| **Backend Hosting** | **Render** | AWS API Gateway | Managed web service runtime |
| **Database** | Built-in JSON Database (`local-db.js`) | Amazon DynamoDB | Document store for users, resources, and shared links |
| **File Storage** | Local Storage Engine | Amazon S3 Presigned URLs | Direct document storage and file retrieval |
| **Authentication** | JSON Web Tokens (JWT) | Amazon Cognito | Stateless role-based authentication |
| **IaC** | `render.yaml` & `vercel.json` | AWS SAM (`template.yaml`) | Declarative infrastructure as code |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js 20+** installed ([Download Node.js](https://nodejs.org/))
- **npm 10+** (bundled with Node.js)
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/24archit/CampusCloud.git
cd CampusCloud
```

### 3. Install Dependencies
```bash
# Install root dev tools, frontend packages, and backend packages
npm run install:all
```

### 4. Configure Environment Variables
- **Backend Configuration** (`backend/.env`):
  ```env
  NODE_ENV=development
  LOCAL_DEV=true
  PORT=3001
  FRONTEND_URL=http://localhost:5173
  JWT_SECRET=campus_cloud_local_secret_key_12345
  ```
- **Frontend Configuration** (`frontend/.env.local`):
  ```env
  VITE_API_URL=http://localhost:3001
  VITE_APP_NAME=CampusCloud
  VITE_ENVIRONMENT=development
  ```
*(For a comprehensive guide, see [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md))*

### 5. Run the Application Locally
```bash
# Start both frontend and backend concurrently
npm run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001/api](http://localhost:3001/api)
- **Health Check:** [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 🌩️ Deployment Guides

### Production Deployment (Actual)
1. **Frontend on Vercel:**
   - Configure root directory or `frontend/`.
   - Set environment variable: `VITE_API_URL=https://<your-render-backend>.onrender.com`.
   - Build command: `npm run build:frontend`. Output directory: `frontend/dist`.
   - Route rewrites handled via `vercel.json`.

2. **Backend on Render:**
   - Deploy using the included `render.yaml` blueprint.
   - Sets runtime to Node.js, command `npm start`, and environment variable `LOCAL_DEV=true`.
   - Binds to `0.0.0.0` with health check at `/api/health`.

*(For complete step-by-step instructions, see [DEPLOYMENT.md](docs/DEPLOYMENT.md))*

---

## 🔌 API Reference Overview

All REST API endpoints are served under `/api` in local/Render environments:

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login and receive JWT tokens |
| `GET` | `/api/auth/profile` | Yes | Get authenticated user profile |
| `PUT` | `/api/auth/profile` | Yes | Update profile details |
| `POST` | `/api/resources/upload-url` | Yes | Request direct upload URL & file key |
| `POST` | `/api/resources` | Yes | Create resource metadata record |
| `GET` | `/api/resources` | Yes | Browse and filter academic catalog |
| `GET` | `/api/resources/my-uploads` | Yes | List resources uploaded by the user |
| `GET` | `/api/resources/:id` | Yes | Get resource details and tags |
| `GET` | `/api/resources/:id/download` | Yes | Get download link and increment stats |
| `DELETE` | `/api/resources/:id` | Yes | Delete own resource |
| `POST` | `/api/resources/:id/share` | Yes | Generate 72-hour ephemeral share link |
| `GET` | `/api/shared/:shareId` | No | Public access to shared resources |
| `GET` | `/api/admin/stats` | Yes (Admin) | Platform analytics and storage usage |
| `GET` | `/api/admin/users` | Yes (Admin) | List registered users |
| `GET` | `/api/admin/resources` | Yes (Admin) | List all resources across the campus |
| `DELETE` | `/api/admin/resources/:id` | Yes (Admin) | Content moderation file deletion |
| `DELETE` | `/api/admin/users/:id` | Yes (Admin) | Moderation user account deletion |

*(Full request bodies and sample responses are documented in [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md))*

---

## 🧪 Testing & Quality Assurance

```bash
# Run backend unit tests with Jest
npm run test:backend

# Run frontend linting
npm run lint:frontend

# Verify frontend production build
npm run build:frontend
```

*(For testing details and manual verification steps, see [TESTING_GUIDE.md](docs/TESTING_GUIDE.md))*

---

## 📚 Complete Project Documentation

| Document | Description |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level system architecture and data flows |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel and Render deployment configurations |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Complete REST API endpoint reference |
| [FRONTEND_ARCHITECTURE.md](docs/FRONTEND_ARCHITECTURE.md) | Frontend component hierarchy and routing |
| [ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md) | Environment variable reference and security |
| [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Unit testing, coverage, and manual verification |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Diagnostic solutions for common setup issues |
| [project-report.md](docs/project-report.md) | Academic capstone project report |
| [team-responsibilities.md](docs/team-responsibilities.md) | Group project contribution breakdown |
| [presentation-slides.md](docs/presentation-slides.md) | Slide outline for project presentation |
| [viva-questions.md](docs/viva-questions.md) | Technical viva preparation Q&A |

---

## 👥 Group Project Team & Responsibilities

| Role | Responsibility Area | Key Deliverables |
|---|---|---|
| **Frontend Lead** | UI/UX & Client Architecture | React 18 SPA, Tailwind design system, client routing, Axios interceptors |
| **Backend Lead** | API & Data Architecture | Express/Lambda REST handlers, JWT authentication, local & DynamoDB data layers |
| **DevOps & Cloud Lead** | Deployment, CI/CD & Security | Vercel & Render hosting configs, AWS SAM template, documentation, CI/CD |

*(See [team-responsibilities.md](docs/team-responsibilities.md) for full individual breakdowns)*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
