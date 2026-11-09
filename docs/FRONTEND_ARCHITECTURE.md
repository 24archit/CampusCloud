# CampusCloud Frontend Architecture

This document describes the structure, component hierarchy, state management, and routing design of the CampusCloud React Single Page Application (SPA).

---

## 1. Technology Overview

- **Framework:** React 18
- **Build Tool & Bundler:** Vite
- **Styling:** TailwindCSS with responsive utilities and custom color tokens
- **Routing:** React Router DOM (v6) with client-side SPA route rewrites
- **HTTP Client:** Axios with centralized interceptors for JWT token injection and error handling
- **Deployment:** Vercel (Edge CDN)

---

## 2. Directory Structure

```
frontend/
├── index.html                  # HTML entry point (title, viewport, favicon)
├── vite.config.js              # Vite configuration & dev server proxy
├── tailwind.config.js          # Tailwind utility and theme definitions
├── vercel.json                 # Vercel deployment rewrites for SPA routing
├── src/
│   ├── main.jsx                # React root mount and strict mode initialization
│   ├── App.jsx                 # Route definitions and global Context providers
│   ├── App.css / index.css     # Global styles and Tailwind base imports
│   │
│   ├── components/             # Reusable UI elements and layout containers
│   │   ├── Layout/
│   │   │   ├── AppLayout.jsx   # Shell with responsive Navbar, Sidebar, and Content Outlet
│   │   │   └── Sidebar.jsx     # Navigation links and collapse state
│   │   └── UI/
│   │       ├── Badge.jsx       # Category and status tag pills
│   │       ├── Button.jsx      # Button variants (primary, secondary, danger, outline)
│   │       ├── Card.jsx        # Rounded card containers with border highlights
│   │       ├── EmptyState.jsx  # Reusable fallback for empty search results/lists
│   │       ├── FileTypeIcon.jsx# Dynamic icons for PDF, DOCX, PPTX, Images, ZIP
│   │       ├── Input.jsx       # Form input with validation states
│   │       ├── Modal.jsx       # Accessible modal dialog overlay
│   │       ├── SearchBar.jsx   # Input with debounce triggers for querying
│   │       ├── Spinner.jsx     # Loading spinners
│   │       └── StatCard.jsx    # Metric visualizers for dashboards
│   │
│   ├── contexts/
│   │   └── AuthContext.jsx     # User authentication state, token storage, and login/logout handlers
│   │
│   ├── lib/
│   │   └── api.js              # Axios instance, URL normalization, and API service functions
│   │
│   └── pages/                  # Page-level route views
│       ├── Landing.jsx         # Public landing page with features and CTA
│       ├── Login.jsx           # Student & Admin authentication
│       ├── Register.jsx        # User signup with password validation
│       ├── Dashboard.jsx       # Student dashboard with analytics and quick actions
│       ├── Resources.jsx       # Resource catalog with search, filter, and pagination
│       ├── ResourceDetail.jsx  # Resource view, download action, and share link modal
│       ├── Upload.jsx          # File upload interface with drag-and-drop
│       ├── MyUploads.jsx       # Personal upload management and deletion
│       ├── Profile.jsx         # User profile viewer and editor
│       ├── SharedResource.jsx  # Ephemeral public resource viewer
│       ├── AdminDashboard.jsx  # System-wide metrics and storage monitor
│       ├── AdminUsers.jsx      # User account moderation
│       └── AdminResources.jsx  # Content moderation and resource removal
```

---

## 3. Application Routing and Protection

Routing is managed via `react-router-dom` in `src/App.jsx`:

### Public Routes
- `/` — `Landing.jsx`: Product overview and registration call-to-actions.
- `/login` — `Login.jsx`: Login view with redirect to dashboard upon success.
- `/register` — `Register.jsx`: Student onboarding.
- `/shared/:shareId` — `SharedResource.jsx`: Ephemeral download page, accessible without prior login.

### Protected Student Routes (Requires valid session)
- `/dashboard` — `Dashboard.jsx`: Student overview and analytics.
- `/resources` — `Resources.jsx`: Searchable academic file repository.
- `/resources/:id` — `ResourceDetail.jsx`: File details and download link generation.
- `/upload` — `Upload.jsx`: File selection, metadata tagging, and upload execution.
- `/my-uploads` — `MyUploads.jsx`: Management of user-uploaded files.
- `/profile` — `Profile.jsx`: Profile editing and statistics.

### Protected Admin Routes (Requires `role === 'admin'`)
- `/admin` — `AdminDashboard.jsx`: Platform health, total users, resources, and storage metrics.
- `/admin/users` — `AdminUsers.jsx`: User roster, role management, and deletion.
- `/admin/resources` — `AdminResources.jsx`: Platform-wide content moderation.

---

## 4. API Communication Layer (`src/lib/api.js`)

The frontend centralizes all HTTP interactions in `src/lib/api.js`:
1. **Dynamic Base URL Resolution:**
   Reads `import.meta.env.VITE_API_URL` and normalizes the path to ensure `/api` is included.
2. **Request Interceptor:**
   Reads the active JWT token from `localStorage` and appends:
   ```
   Authorization: Bearer <token>
   ```
3. **Response Interceptor:**
   Catches `401 Unauthorized` responses and automatically triggers logout or session renewal.

---

## 5. File Upload & Direct Storage Flow

1. User selects a file (PDF, PPT, DOCX, ZIP, etc.) in `Upload.jsx`.
2. Frontend requests an upload destination from backend (`POST /api/resources/upload-url`).
3. Backend returns an authorized direct upload URL and storage key.
4. Frontend performs a direct HTTP `PUT` request with file bytes.
5. Upon successful transfer, frontend notifies backend (`POST /api/resources`) to create the persistent metadata record.
