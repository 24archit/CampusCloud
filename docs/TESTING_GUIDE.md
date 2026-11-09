# CampusCloud Testing & Verification Guide

This guide details the testing commands, automated test suites, and manual verification procedures for CampusCloud.

---

## 1. Automated Unit Tests

The backend test suite is built using **Jest** and tests the core handlers: authentication, resource management, and administrative moderation.

### Prerequisites
Ensure backend dependencies are installed:
```bash
cd backend
npm install
```

### Running Backend Unit Tests
From the project root:
```bash
npm run test:backend
# or
npm run test:all
```

From the `backend/` directory:
```bash
cd backend
npm test
```

### Running with Code Coverage
```bash
cd backend
npm run test:coverage
```

### Verified Test Suites
1. **Authentication Tests (`backend/tests/auth.test.js`):**
   - User registration with email format and password strength validation.
   - Prevention of duplicate account registration.
   - Successful user login and JWT token issuance.
   - Rejection of invalid credentials.
   - Fetching and updating user profiles.

2. **Resource Management Tests (`backend/tests/resources.test.js`):**
   - Presigned upload URL generation and filename sanitization.
   - Creation of resource records with category and tag metadata.
   - Searching resources with keyword debouncing.
   - Listing uploads for the authenticated user.
   - Ephemeral share link creation with Time-To-Live (TTL) expiration.
   - Authorization checks when deleting resources (preventing non-owners from deleting files).

3. **Admin Moderation Tests (`backend/tests/admin.test.js`):**
   - Access rejection for standard users attempting admin routes.
   - Platform statistics aggregation (user counts, resource counts, storage volume).
   - Administrative file deletion and user management.

---

## 2. Frontend Linting & Build Verification

To verify frontend compilation and code quality:

```bash
# Run ESLint on the frontend codebase
npm run lint:frontend

# Build frontend production bundle with Vite
npm run build:frontend
```

---

## 3. Manual Verification Checklist

Follow this workflow to manually verify a deployed or local instance:

1. **Service Health Check:**
   - Execute `curl http://localhost:3001/api/health` (or production URL).
   - Expected status: `{"status":"ok"}`.
2. **Student Registration:**
   - Navigate to `/register`.
   - Submit a new user registration.
   - Confirm immediate redirect to the dashboard.
3. **Resource Upload:**
   - Go to `/upload`.
   - Drag-and-drop a sample file (`.pdf`, `.docx`, etc.).
   - Fill in Title, Subject, and Category.
   - Click **Upload Resource**.
   - Verify file shows up under **My Uploads** and in the public **Resources** catalog.
4. **Download & Share:**
   - Click into the resource details page.
   - Test the download action.
   - Click **Share**, copy the generated link, open in an incognito window, and verify public access.
5. **Admin Console:**
   - Log in with an account having `role: "admin"`.
   - Open `/admin` to verify platform analytics and user lists.
