'use strict';

/**
 * tests/resources.test.js
 * Unit tests for src/handlers/resources.js
 */

jest.mock('../src/services/dynamodb');
jest.mock('../src/services/s3');

const db = require('../src/services/dynamodb');
const s3 = require('../src/services/s3');

const jwt = require('jsonwebtoken');
const SECRET = 'local-dev-secret-change-in-production';
process.env.JWT_SECRET = SECRET;
process.env.S3_BUCKET = 'test-bucket';

const {
  getUploadUrl,
  createResource,
  listResources,
  getResource,
  downloadResource,
  deleteResource,
  getMyUploads,
  createShareLink,
} = require('../src/handlers/resources');

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeEvent = (overrides = {}) => ({
  headers: {},
  body: null,
  pathParameters: null,
  queryStringParameters: null,
  ...overrides,
});

const authHeader = (payload = { userId: 'u1', email: 'alice@test.com', name: 'Alice', role: 'student' }) => ({
  Authorization: `Bearer ${jwt.sign(payload, SECRET)}`,
});

const parseBody = (res) => JSON.parse(res.body);

const sampleResource = {
  resourceId: 'r1',
  title: 'Test Notes',
  description: 'Some notes',
  subject: 'Math',
  category: 'Notes',
  tags: ['math'],
  s3Key: 'resources/u1/r1-notes.pdf',
  fileName: 'notes.pdf',
  fileType: 'application/pdf',
  fileSize: 1024,
  uploaderId: 'u1',
  uploaderName: 'Alice',
  uploaderEmail: 'alice@test.com',
  downloadCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isDeleted: false,
};

// ── getUploadUrl ──────────────────────────────────────────────────────────────
describe('getUploadUrl', () => {
  beforeEach(() => jest.clearAllMocks());

  test('valid data → returns presigned URL info', async () => {
    s3.getUploadPresignedUrl.mockResolvedValue('https://s3.presigned.url/upload');

    const event = makeEvent({
      headers: authHeader(),
      body: JSON.stringify({
        fileName: 'notes.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        title: 'Test Notes',
        subject: 'Math',
        category: 'Notes',
      }),
    });

    const result = await getUploadUrl(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.uploadUrl).toBe('https://s3.presigned.url/upload');
    expect(body.data.s3Key).toMatch(/^resources\/u1\//);
    expect(body.data.resourceId).toBeDefined();
  });

  test('invalid file type → 400', async () => {
    const event = makeEvent({
      headers: authHeader(),
      body: JSON.stringify({
        fileName: 'virus.exe',
        fileType: 'application/x-msdownload',
        fileSize: 1024,
        title: 'Bad File',
        subject: 'Math',
        category: 'Notes',
      }),
    });

    const result = await getUploadUrl(event);
    expect(result.statusCode).toBe(400);
    expect(parseBody(result).error).toMatch(/not allowed/i);
  });

  test('file too large → 400', async () => {
    const event = makeEvent({
      headers: authHeader(),
      body: JSON.stringify({
        fileName: 'big.pdf',
        fileType: 'application/pdf',
        fileSize: 100 * 1024 * 1024, // 100 MB
        title: 'Big File',
        subject: 'Math',
        category: 'Notes',
      }),
    });

    const result = await getUploadUrl(event);
    expect(result.statusCode).toBe(400);
    expect(parseBody(result).error).toMatch(/too large/i);
  });

  test('no auth → 401', async () => {
    const result = await getUploadUrl(makeEvent({ body: JSON.stringify({}) }));
    expect(result.statusCode).toBe(401);
  });
});

// ── createResource ────────────────────────────────────────────────────────────
describe('createResource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('valid data → creates resource in DynamoDB', async () => {
    db.put.mockResolvedValue({});
    db.update.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader(),
      body: JSON.stringify({
        resourceId: '11111111-1111-1111-1111-111111111111',
        title: 'Test Notes',
        subject: 'Math',
        category: 'Notes',
        s3Key: 'resources/u1/r1-notes.pdf',
        fileName: 'notes.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
      }),
    });

    const result = await createResource(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(201);
    expect(body.data.resource.title).toBe('Test Notes');
    expect(body.data.resource.uploaderId).toBe('u1');
    expect(db.put).toHaveBeenCalledTimes(1);
  });

  test('missing required field → 400', async () => {
    const event = makeEvent({
      headers: authHeader(),
      body: JSON.stringify({ title: 'Notes', subject: 'Math' }), // missing many fields
    });
    const result = await createResource(event);
    expect(result.statusCode).toBe(400);
  });
});

// ── listResources ─────────────────────────────────────────────────────────────
describe('listResources', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns paginated list', async () => {
    db.scan.mockResolvedValue({ Items: [sampleResource] });

    const event = makeEvent({
      headers: authHeader(),
      queryStringParameters: { page: '1', limit: '10' },
    });

    const result = await listResources(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });

  test('filters by category', async () => {
    const resources = [
      { ...sampleResource, resourceId: 'r1', category: 'Notes', isDeleted: false },
      { ...sampleResource, resourceId: 'r2', category: 'Books', isDeleted: false },
    ];
    db.scan.mockResolvedValue({ Items: resources });

    const event = makeEvent({
      headers: authHeader(),
      queryStringParameters: { category: 'Notes' },
    });

    const result = await listResources(event);
    const body = parseBody(result);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].category).toBe('Notes');
  });

  test('search filters by title', async () => {
    const resources = [
      { ...sampleResource, resourceId: 'r1', title: 'Calculus Notes', isDeleted: false },
      { ...sampleResource, resourceId: 'r2', title: 'Physics Lab', isDeleted: false },
    ];
    db.scan.mockResolvedValue({ Items: resources });

    const event = makeEvent({
      headers: authHeader(),
      queryStringParameters: { search: 'calculus' },
    });

    const result = await listResources(event);
    const body = parseBody(result);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0].title).toBe('Calculus Notes');
  });

  test('no auth → 401', async () => {
    const result = await listResources(makeEvent());
    expect(result.statusCode).toBe(401);
  });
});

// ── getResource ───────────────────────────────────────────────────────────────
describe('getResource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('valid ID → returns resource', async () => {
    db.get.mockResolvedValue({ Item: sampleResource });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await getResource(event);
    expect(result.statusCode).toBe(200);
    expect(parseBody(result).data.resource.resourceId).toBe('r1');
  });

  test('not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'nonexistent' },
    });

    const result = await getResource(event);
    expect(result.statusCode).toBe(404);
  });

  test('soft-deleted resource → 404', async () => {
    db.get.mockResolvedValue({ Item: { ...sampleResource, isDeleted: true } });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await getResource(event);
    expect(result.statusCode).toBe(404);
  });
});

// ── downloadResource ──────────────────────────────────────────────────────────
describe('downloadResource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns download URL', async () => {
    db.get.mockResolvedValue({ Item: sampleResource });
    db.update.mockResolvedValue({});
    s3.getDownloadPresignedUrl.mockResolvedValue('https://s3.presigned.url/download');

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await downloadResource(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.downloadUrl).toBe('https://s3.presigned.url/download');
    expect(body.data.fileName).toBe('notes.pdf');
  });

  test('resource not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'nope' },
    });

    const result = await downloadResource(event);
    expect(result.statusCode).toBe(404);
  });
});

// ── deleteResource ────────────────────────────────────────────────────────────
describe('deleteResource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('owner can delete', async () => {
    db.get.mockResolvedValue({ Item: { ...sampleResource, uploaderId: 'u1' } });
    db.update.mockResolvedValue({});
    s3.deleteObject.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'alice@test.com', name: 'Alice', role: 'student' }),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await deleteResource(event);
    expect(result.statusCode).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  test('non-owner → 403', async () => {
    db.get.mockResolvedValue({ Item: { ...sampleResource, uploaderId: 'other-user' } });

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'alice@test.com', name: 'Alice', role: 'student' }),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await deleteResource(event);
    expect(result.statusCode).toBe(403);
  });

  test('resource not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'ghost' },
    });

    const result = await deleteResource(event);
    expect(result.statusCode).toBe(404);
  });
});

// ── getMyUploads ──────────────────────────────────────────────────────────────
describe('getMyUploads', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns user uploads', async () => {
    db.scan.mockResolvedValue({ Items: [sampleResource] });

    const event = makeEvent({ headers: authHeader() });
    const result = await getMyUploads(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.resources).toHaveLength(1);
  });
});

// ── createShareLink ───────────────────────────────────────────────────────────
describe('createShareLink', () => {
  beforeEach(() => jest.clearAllMocks());

  test('creates share link', async () => {
    db.get.mockResolvedValue({ Item: sampleResource });
    db.put.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await createShareLink(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(201);
    expect(body.data.shareId).toBeDefined();
    expect(body.data.shareLink).toContain('/shared/');
    expect(body.data.expiresAt).toBeDefined();
  });

  test('resource not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(),
      pathParameters: { resourceId: 'ghost' },
    });

    const result = await createShareLink(event);
    expect(result.statusCode).toBe(404);
  });
});
