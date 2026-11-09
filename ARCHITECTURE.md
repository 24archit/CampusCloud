# Cloud-Based Smart Campus Resource Management System
## Architecture Overview

### Actual Production Deployment Stack
- **Frontend Hosting:** Vercel (React 18 + Vite SPA, Global Edge Delivery)
- **Backend Hosting:** Render (Node.js 20 Web Service via Express engine)
- **Local Persistence & Emulation:** In-memory & local JSON database (`local-dev/data/`) with file system storage (`local-dev/uploads/`)
- **Alternative / Cloud-Native Target:** AWS Serverless (AWS Lambda, Amazon API Gateway, DynamoDB, Amazon S3)

---

### System Architecture Diagram

```
┌─────────────────────────────────┐           REST API / HTTPS           ┌────────────────────────────────┐
│         Vercel (Edge)           │ ───────────────────────────────────> │         Render (PaaS)          │
│                                 │                                      │                                │
│  - React 18 + Vite SPA          │ <─────────────────────────────────── │  - Node.js 20 Web Service      │
│  - TailwindCSS Design System    │            JSON Responses            │  - REST Handler Adapters       │
│  - SPA Routing (vercel.json)    │                                      │  - JWT Auth & CORS Middleware  │
│  - Axios HTTP Interceptors      │                                      │  - JSON DB / DynamoDB Service  │
│                                 │                                      │  - Local Uploads / S3 Storage  │
└─────────────────────────────────┘                                      └────────────────────────────────┘
                                                                                         │
                                         ┌───────────────────────────────────────────────┴────────┐
                                         │ (Optional AWS Cloud Backing via template.yaml)         │
                                         ▼                         ▼                              ▼
                                  ┌─────────────┐           ┌──────────────┐              ┌───────────────┐
                                  │  DynamoDB   │           │  Amazon S3   │              │ Amazon Cognito│
                                  │  Metadata   │           │ Object Store │              │ Auth Service  │
                                  └─────────────┘           └──────────────┘              └───────────────┘
```

---

### Tech Stack Details

| Component | Actual Deployment | Optional / Alternative Cloud Target | Purpose |
|---|---|---|---|
| **Frontend** | Vercel | Amazon S3 + Amazon CloudFront | Responsive React 18 Single Page Application |
| **Backend** | Render (Node.js 20) | AWS Lambda (SAM / CloudFormation) | REST API microservices & business logic |
| **API Layer** | Render Express Engine | Amazon API Gateway | HTTP routing, CORS handling, payload validation |
| **Authentication** | JWT Stateless Auth | Amazon Cognito User Pools | Role-based authentication (Student & Admin) |
| **Database** | Local JSON DB (`local-db.js`) | Amazon DynamoDB | Schemaless document store with GSI indexes |
| **File Storage** | Local File Storage | Amazon S3 Presigned URLs | Secure document storage & uploads |

---

### Database Schemas / Tables
1. **Users** (Key: `userId`, Index: `email`)
   - Stores user authentication records, profile details, and roles (`student`, `admin`).
2. **Resources** (Key: `resourceId`, Indexes: `uploaderId`, `category`)
   - Stores academic resource metadata, file keys, download counters, and category tags.
3. **SharedLinks** (Key: `shareId`, TTL: `expiresAt`)
   - Ephemeral public access records governed by a 72-hour automated Time-To-Live expiration.

---

### Core API Endpoints
All backend endpoints are prefixed with `/api` on Render / local development, and `/prod` on API Gateway.

- **Authentication:**
  - `POST /api/auth/register` - Register a new student or faculty account
  - `POST /api/auth/login` - Authenticate credentials and issue JWT tokens
  - `GET /api/auth/profile` - Fetch current user profile and statistics
  - `PUT /api/auth/profile` - Update profile information
  - `POST /api/auth/change-password` - Update password
- **Resources:**
  - `POST /api/resources/upload-url` - Request direct upload URL and storage key
  - `POST /api/resources` - Record resource metadata in database
  - `GET /api/resources` - Browse and search catalog (supports `q`, `category`, `subject`)
  - `GET /api/resources/:resourceId` - Get resource details
  - `GET /api/resources/:resourceId/download` - Get authorized download URL
  - `GET /api/resources/my-uploads` - List user's uploaded materials
  - `DELETE /api/resources/:resourceId` - Remove uploaded resource
  - `POST /api/resources/:resourceId/share` - Create 72-hour ephemeral share link
- **Shared Access:**
  - `GET /api/shared/:shareId` - Public access for shared academic materials
- **Administration:**
  - `GET /api/admin/stats` - Platform metrics (users, resources, storage volume)
  - `GET /api/admin/users` - View registered users
  - `GET /api/admin/resources` - Review all resources across the campus
  - `DELETE /api/admin/resources/:resourceId` - Moderate and delete resources
  - `DELETE /api/admin/users/:userId` - Remove user account
