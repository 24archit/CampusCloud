# CampusCloud Backend API Documentation

This document describes all verified HTTP REST API routes exposed by CampusCloud backend services.

- **Base URL (Local):** `http://localhost:3001/api`
- **Base URL (Render Production):** `https://<render-service-name>.onrender.com/api`
- **Base URL (AWS API Gateway):** `https://<api-id>.execute-api.ap-south-1.amazonaws.com/prod`

---

## 1. Authentication & Profile Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Path:** `/api/auth/register` (or `/auth/register` on API Gateway)
- **Auth Required:** No
- **Request Body (`application/json`):**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "password": "Password123!",
    "role": "student"
  }
  ```
- **Responses:**
  - `201 Created`: User registered successfully; returns user profile and initial JWT tokens.
  - `400 Bad Request`: Validation failure (invalid email, weak password, or missing fields).
  - `409 Conflict`: User with this email already exists.

### 1.2 User Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Auth Required:** No
- **Request Body (`application/json`):**
  ```json
  {
    "email": "jane@campus.edu",
    "password": "Password123!"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "user": {
        "userId": "usr_abc123",
        "email": "jane@campus.edu",
        "name": "Jane Doe",
        "role": "student"
      },
      "token": "<jwt-token>",
      "idToken": "<jwt-token>"
    }
    ```
  - `401 Unauthorized`: Invalid credentials.

### 1.3 Get Current Profile
- **Method:** `GET`
- **Path:** `/api/auth/profile`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Responses:**
  - `200 OK`: Returns current authenticated user record, upload counts, and storage stats.
  - `401 Unauthorized`: Missing or invalid token.

### 1.4 Update Profile
- **Method:** `PUT`
- **Path:** `/api/auth/profile`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body (`application/json`):**
  ```json
  {
    "name": "Jane Doe Updated",
    "department": "Computer Science",
    "semester": "6"
  }
  ```
- **Responses:**
  - `200 OK`: Updated profile object.
  - `400 Bad Request`: Validation error.

### 1.5 Change Password
- **Method:** `POST`
- **Path:** `/api/auth/change-password`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body (`application/json`):**
  ```json
  {
    "oldPassword": "CurrentPassword123!",
    "newPassword": "NewStrongPassword123!"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Password updated successfully" }`
  - `400 Bad Request`: Invalid old password or weak new password.

---

## 2. Resource Management Endpoints

### 2.1 Request Upload URL (Presigned / Storage URL)
- **Method:** `POST`
- **Path:** `/api/resources/upload-url`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body (`application/json`):**
  ```json
  {
    "fileName": "lecture-notes-unit-1.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576
  }
  ```
- **Responses:**
  - `200 OK`: Returns direct upload URL and target storage file key.
    ```json
    {
      "success": true,
      "uploadUrl": "http://localhost:3001/api/local-storage/upload/...",
      "fileKey": "resources/usr_abc/uuid-lecture-notes-unit-1.pdf"
    }
    ```

### 2.2 Create Resource Record
- **Method:** `POST`
- **Path:** `/api/resources`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body (`application/json`):**
  ```json
  {
    "title": "Distributed Systems Unit 1 Notes",
    "subject": "Distributed Systems",
    "category": "Notes",
    "description": "Comprehensive semester 6 lecture notes",
    "fileKey": "resources/usr_abc/uuid-lecture-notes-unit-1.pdf",
    "fileName": "lecture-notes-unit-1.pdf",
    "fileSize": 1048576,
    "fileType": "application/pdf",
    "tags": ["cloud", "systems", "unit1"]
  }
  ```
- **Responses:**
  - `201 Created`: Created resource object with `resourceId`.

### 2.3 List & Search Resources
- **Method:** `GET`
- **Path:** `/api/resources`
- **Auth Required:** Yes
- **Query Parameters:**
  - `q` (string): Keyword search against title, description, or subject
  - `category` (string): Filter by category (e.g. `Notes`, `Question Papers`, `Lab Manuals`)
  - `subject` (string): Filter by subject name
  - `page` (number): Pagination page index
  - `limit` (number): Page limit
- **Responses:**
  - `200 OK`: Array of resource metadata items and total count.

### 2.4 Get Single Resource Details
- **Method:** `GET`
- **Path:** `/api/resources/:resourceId`
- **Auth Required:** Yes
- **Responses:**
  - `200 OK`: Resource record including uploader details, views, download count, and tags.
  - `404 Not Found`: Resource not found.

### 2.5 Download Resource
- **Method:** `GET`
- **Path:** `/api/resources/:resourceId/download`
- **Auth Required:** Yes
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "downloadUrl": "http://localhost:3001/api/local-storage/download/...",
      "fileName": "lecture-notes-unit-1.pdf"
    }
    ```
  - Increments download counter in the database.

### 2.6 List My Uploads
- **Method:** `GET`
- **Path:** `/api/resources/my-uploads`
- **Auth Required:** Yes
- **Responses:**
  - `200 OK`: Array of resources uploaded by the authenticated user.

### 2.7 Delete Resource
- **Method:** `DELETE`
- **Path:** `/api/resources/:resourceId`
- **Auth Required:** Yes (User must be the owner or admin)
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Resource deleted" }`
  - `403 Forbidden`: User does not have permission to delete this resource.

### 2.8 Create Ephemeral Share Link
- **Method:** `POST`
- **Path:** `/api/resources/:resourceId/share`
- **Auth Required:** Yes
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "shareId": "sh_xyz789",
      "shareLink": "http://localhost:5173/shared/sh_xyz789",
      "expiresAt": 1794280000
    }
    ```

---

## 3. Public Ephemeral Sharing Endpoints

### 3.1 Access Shared Resource
- **Method:** `GET`
- **Path:** `/api/shared/:shareId`
- **Auth Required:** No (Publicly accessible with valid token/shareId before expiration)
- **Responses:**
  - `200 OK`: Shared resource metadata and immediate download link.
  - `404 / 410 Gone`: Share link expired or not found.

---

## 4. Administrative Endpoints

*(Requires user role `admin`)*

### 4.1 Platform Statistics
- **Method:** `GET`
- **Path:** `/api/admin/stats`
- **Auth Required:** Yes (`admin`)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "totalUsers": 42,
      "totalResources": 188,
      "totalDownloads": 512,
      "totalStorageBytes": 104857600
    }
    ```

### 4.2 List All Users
- **Method:** `GET`
- **Path:** `/api/admin/users`
- **Auth Required:** Yes (`admin`)

### 4.3 List All Resources
- **Method:** `GET`
- **Path:** `/api/admin/resources`
- **Auth Required:** Yes (`admin`)

### 4.4 Admin Delete Resource
- **Method:** `DELETE`
- **Path:** `/api/admin/resources/:resourceId`
- **Auth Required:** Yes (`admin`)

### 4.5 Admin Delete User
- **Method:** `DELETE`
- **Path:** `/api/admin/users/:userId`
- **Auth Required:** Yes (`admin`)

---

## 5. Health & Diagnostic Endpoints

### 5.1 Service Health
- **Method:** `GET`
- **Path:** `/api/health`
- **Auth Required:** No
- **Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-09T12:00:00.000Z"
  }
  ```
