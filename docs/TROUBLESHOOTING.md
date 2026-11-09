# CampusCloud Troubleshooting Guide

This guide covers common setup, configuration, runtime, and deployment issues with verified diagnostic steps and solutions.

---

## 1. Local Development Issues

### 1.1 `'jest' is not recognized as an internal or external command`
- **Cause:** Backend dependencies (`node_modules`) have not been installed yet.
- **Solution:**
  ```bash
  cd backend
  npm install
  npm test
  ```

### 1.2 Port 3001 or 5173 Already in Use
- **Cause:** Another process or previous node session is running on the default ports.
- **Solution:**
  - On Windows:
    ```powershell
    Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
    ```
  - Alternatively, specify another port in `backend/.env`:
    ```env
    PORT=3002
    ```
    and update `VITE_API_URL=http://localhost:3002` in `frontend/.env.local`.

### 1.3 `Network Error` or Connection Refused in Browser
- **Cause:** Backend server is not running or `VITE_API_URL` is pointing to the wrong port.
- **Solution:**
  - Verify backend is alive: `curl http://localhost:3001/api/health`.
  - Check `frontend/.env.local` or environment variables for correct URL.
  - Restart with `npm run dev`.

---

## 2. Production Deployment Issues (Vercel & Render)

### 2.1 Backend Request Delay (Cold Starts on Render)
- **Symptom:** The first request to the backend takes 30-50 seconds to complete.
- **Cause:** Render free-tier instances sleep after 15 minutes of inactivity.
- **Solution:** This is normal behavior for free-tier hosting. The server will spin up and remain warm while active. You can set up an external uptime monitor (e.g., UptimeRobot) to ping `/api/health` every 10 minutes.

### 2.2 CORS Policy Error on Frontend
- **Symptom:** Browser console outputs `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`.
- **Cause:** Backend `FRONTEND_URL` environment variable does not match the Vercel deployment URL, or request headers are missing.
- **Solution:**
  - In Render Dashboard under **Environment Variables**, set `FRONTEND_URL` to your Vercel deployment domain (e.g. `https://campuscloud.vercel.app`).
  - Note that CampusCloud's CORS middleware allows all origins by default when no specific match is required, but credentials require origin alignment.

### 2.3 Page 404 on Refresh in Vercel
- **Symptom:** Navigating works via UI, but hard refreshing `/dashboard` or `/resources` returns 404.
- **Cause:** Client-side SPA routing not redirected to `index.html`.
- **Solution:** Ensure `vercel.json` exists in root and `frontend/` containing:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### 2.4 Missing Shared Link or Ephemeral Link 404
- **Symptom:** Shared link says expired or not found.
- **Cause:** Ephemeral links have a 72-hour Time-To-Live (TTL). Once the expiration epoch is reached, the record is removed.
- **Solution:** Regenerate a new share link from the resource details page.
