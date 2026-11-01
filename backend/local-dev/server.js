'use strict';

/**
 * Local development Express server that mimics AWS API Gateway.
 * Run with: npm start  (or npm run dev for hot-reload via nodemon)
 *
 * This server does NOT require AWS credentials — it uses the real handlers
 * and includes a built-in local persistence and storage emulator.
 */

const fs = require('fs');
const path = require('path');

// Safe built-in .env loader (zero external dependencies)
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

// Ensure local dev mode is active
process.env.LOCAL_DEV = process.env.LOCAL_DEV || 'true';

const express = require('express');
const corsMiddleware = require('../src/middleware/cors');

const authHandler = require('../src/handlers/auth');
const resourcesHandler = require('../src/handlers/resources');
const adminHandler = require('../src/handlers/admin');
const sharedHandler = require('../src/handlers/shared');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));

// ── Lambda adapter ──────────────────────────────────────────────────────────
/**
 * Wraps a Lambda handler so it can be used as an Express route handler.
 * Builds a Lambda-shaped event from the Express request.
 */
const mockLambda = (handler) => async (req, res) => {
  const event = {
    httpMethod: req.method,
    path: req.path,
    pathParameters: Object.keys(req.params).length ? req.params : null,
    queryStringParameters: Object.keys(req.query).length ? req.query : null,
    headers: req.headers,
    body: req.body ? JSON.stringify(req.body) : null,
    requestContext: {
      http: { method: req.method, path: req.path },
    },
  };

  try {
    const result = await handler(event, {});
    const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
    res.status(result.statusCode).json(body);
  } catch (err) {
    console.error('Unhandled error in Lambda adapter:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// ── Local Storage Emulation (S3 PUT/GET replacement for offline local dev) ─
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

app.put('/api/local-storage/upload/:key(*)', express.raw({ type: '*/*', limit: '50mb' }), (req, res) => {
  try {
    const rawKey = req.params.key || req.params[0] || 'upload';
    const safeFilename = decodeURIComponent(rawKey).replace(/[/\\?%*:|"<>]/g, '_');
    const dest = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(dest, req.body);
    res.status(200).json({ success: true, message: 'File stored locally' });
  } catch (err) {
    console.error('Local upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/local-storage/download/:key(*)', (req, res) => {
  try {
    const rawKey = req.params.key || req.params[0] || 'download';
    const safeFilename = decodeURIComponent(rawKey).replace(/[/\\?%*:|"<>]/g, '_');
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    const filename = req.query.filename || path.basename(decodeURIComponent(rawKey));

    if (fs.existsSync(filePath)) {
      res.download(filePath, filename);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(`%PDF-1.4 Mock CampusCloud Resource: ${filename}`));
    }
  } catch (err) {
    console.error('Local download error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Auth routes ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', mockLambda(authHandler.register));
app.post('/api/auth/login', mockLambda(authHandler.login));
app.get('/api/auth/profile', mockLambda(authHandler.getProfile));
app.put('/api/auth/profile', mockLambda(authHandler.updateProfile));
app.post('/api/auth/change-password', mockLambda(authHandler.changePassword));

// ── Resource routes ─────────────────────────────────────────────────────────
// NOTE: /my-uploads MUST be registered before /:resourceId to avoid ambiguity
app.post('/api/resources/upload-url', mockLambda(resourcesHandler.getUploadUrl));
app.post('/api/resources', mockLambda(resourcesHandler.createResource));
app.get('/api/resources/my-uploads', mockLambda(resourcesHandler.getMyUploads));
app.get('/api/resources', mockLambda(resourcesHandler.listResources));
app.get('/api/resources/:resourceId', mockLambda(resourcesHandler.getResource));
app.get('/api/resources/:resourceId/download', mockLambda(resourcesHandler.downloadResource));
app.delete('/api/resources/:resourceId', mockLambda(resourcesHandler.deleteResource));
app.post('/api/resources/:resourceId/share', mockLambda(resourcesHandler.createShareLink));

// ── Shared link routes ──────────────────────────────────────────────────────
app.get('/api/shared/:shareId', mockLambda(sharedHandler.getSharedResource));

// ── Admin routes ────────────────────────────────────────────────────────────
app.get('/api/admin/stats', mockLambda(adminHandler.getStats));
app.get('/api/admin/users', mockLambda(adminHandler.getUsers));
app.get('/api/admin/resources', mockLambda(adminHandler.getResources));
app.delete('/api/admin/resources/:resourceId', mockLambda(adminHandler.adminDeleteResource));
app.delete('/api/admin/users/:userId', mockLambda(adminHandler.deleteUser));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Static Frontend Serving (enables full-stack single-app cloud deployment) ─
const FRONTEND_DIST = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => res.status(404).json({ success: false, error: 'API route not found' }));
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 CampusCloud Backend running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Mode:   Local Dev (DynamoDB & S3 Emulated)`);
    console.log(`======================================================\n`);
  });
}

module.exports = app;
