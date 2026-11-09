# CampusCloud Environment Setup Guide

This guide describes all configuration variables used across the CampusCloud frontend, backend, and deployment environments.

> **Security Notice:** Never commit actual `.env` files containing secrets to version control. Keep `.env` files in `.gitignore`.

---

## 1. Frontend Environment Variables

Frontend variables are read at build time by Vite. Variables exposed to the browser client must begin with `VITE_`.

### Configuration File: `frontend/.env.local` or Vercel Environment Settings

| Variable Name | Required | Default / Example Value | Description |
|---|---|---|---|
| `VITE_API_URL` | Yes | `http://localhost:3001` (Dev) / `https://campuscloud.onrender.com` (Prod) | Base URL of the backend REST API. Can be with or without `/api`. |
| `VITE_APP_NAME` | No | `CampusCloud` | Application title rendered in navigation and meta tags. |
| `VITE_ENVIRONMENT` | No | `development` / `production` | Indicates build environment. |
| `VITE_COGNITO_USER_POOL_ID` | Optional | `ap-south-1_XXXXXXXXX` | AWS Cognito User Pool ID (used only when deploying with AWS Cognito). |
| `VITE_COGNITO_CLIENT_ID` | Optional | `xxxxxxxxxxxxxxxxxxxxxxxxxx` | AWS Cognito App Client ID (used only with AWS Cognito). |

---

## 2. Backend Environment Variables

Backend variables are accessed via `process.env` in Node.js.

### Configuration File: `backend/.env` or Render Web Service Settings

| Variable Name | Required | Default / Example Value | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` (Local) / `production` (Render) | Runtime environment mode. |
| `PORT` | No | `3001` (Render automatically injects `10000`) | Network port on which the Express server listens. |
| `LOCAL_DEV` | Yes (for Render/Local) | `true` | When set to `'true'`, uses local JSON persistence (`backend/local-dev/data/`) and local file storage (`backend/local-dev/uploads/`). |
| `JWT_SECRET` | Yes | Long random string (Render auto-generates) | Secret key used to sign and verify JSON Web Tokens for authentication. |
| `FRONTEND_URL` | No | `http://localhost:5173` (Local) / `https://campuscloud.vercel.app` (Prod) | Client origin allowed for Cross-Origin Resource Sharing (CORS) and generating public share links. |
| `USERS_TABLE` | Optional | `campus-cloud-users-dev` | DynamoDB table name for users (only when `LOCAL_DEV` is not enabled). |
| `RESOURCES_TABLE` | Optional | `campus-cloud-resources-dev` | DynamoDB table name for academic resources (only with AWS). |
| `SHARED_LINKS_TABLE` | Optional | `campus-cloud-shared-links-dev` | DynamoDB table name for temporary share links (only with AWS). |
| `S3_BUCKET` | Optional | `campus-cloud-resources-dev-<account-id>` | S3 bucket name for file storage (only with AWS). |
| `AWS_REGION` | Optional | `ap-south-1` | Target AWS region (only with AWS). |

---

## 3. Step-by-Step Local Setup

1. Copy the example environment template in `backend/`:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. For local testing without AWS credentials, ensure:
   ```env
   LOCAL_DEV=true
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=super_secret_local_dev_key_12345
   ```
3. Create `frontend/.env.local`:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_APP_NAME=CampusCloud
   VITE_ENVIRONMENT=development
   ```
4. Start development server from repository root:
   ```bash
   npm run dev
   ```
