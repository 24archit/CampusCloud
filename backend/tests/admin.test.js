'use strict';

/**
 * tests/admin.test.js
 * Unit tests for src/handlers/admin.js
 */

jest.mock('../src/services/dynamodb');
jest.mock('../src/services/s3');

const db = require('../src/services/dynamodb');
const s3 = require('../src/services/s3');

const jwt = require('jsonwebtoken');
const SECRET = 'local-dev-secret-change-in-production';
process.env.JWT_SECRET = SECRET;

const { getStats, getUsers, getResources, adminDeleteResource, deleteUser } = require('../src/handlers/admin');

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeEvent = (overrides = {}) => ({
  headers: {},
  body: null,
  pathParameters: null,
  queryStringParameters: null,
  ...overrides,
});

const authHeader = (payload) => ({
  Authorization: `Bearer ${jwt.sign(payload, SECRET)}`,
});

const adminPayload = { userId: 'admin1', email: 'admin@test.com', name: 'Admin', role: 'admin' };
const studentPayload = { userId: 'student1', email: 'student@test.com', name: 'Student', role: 'student' };

const parseBody = (res) => JSON.parse(res.body);

const sampleUsers = [
  { userId: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', uploadCount: 2, passwordHash: 'x' },
  { userId: 'u2', name: 'Bob', email: 'bob@test.com', role: 'student', uploadCount: 0, passwordHash: 'y' },
];

const now = new Date().toISOString();
const sampleResources = [
  { resourceId: 'r1', title: 'Notes 1', category: 'Notes', fileSize: 1024, isDeleted: false, createdAt: now },
  { resourceId: 'r2', title: 'Notes 2', category: 'Books', fileSize: 2048, isDeleted: false, createdAt: now },
  { resourceId: 'r3', title: 'Deleted', category: 'Notes', fileSize: 512, isDeleted: true, createdAt: now },
];

// ── getStats ──────────────────────────────────────────────────────────────────
describe('getStats', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin → returns stats object', async () => {
    db.scan
      .mockResolvedValueOnce({ Items: sampleUsers })       // users scan
      .mockResolvedValueOnce({ Items: sampleResources });  // resources scan

    const event = makeEvent({ headers: authHeader(adminPayload) });
    const result = await getStats(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.totalUsers).toBe(2);
    expect(body.data.totalResources).toBe(2); // excludes soft-deleted
    expect(body.data.totalStorageBytes).toBe(1024 + 2048);
    expect(body.data.resourcesByCategory).toBeDefined();
    expect(body.data.uploadsThisMonth).toBeGreaterThanOrEqual(0);
  });

  test('student → 403', async () => {
    const event = makeEvent({ headers: authHeader(studentPayload) });
    const result = await getStats(event);
    expect(result.statusCode).toBe(403);
  });

  test('no token → 401', async () => {
    const result = await getStats(makeEvent());
    expect(result.statusCode).toBe(401);
  });
});

// ── getUsers ──────────────────────────────────────────────────────────────────
describe('getUsers', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin → returns users list without password hashes', async () => {
    db.scan.mockResolvedValue({ Items: sampleUsers });

    const event = makeEvent({ headers: authHeader(adminPayload) });
    const result = await getUsers(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.users).toHaveLength(2);
    // No passwordHash exposed
    body.data.users.forEach((u) => expect(u.passwordHash).toBeUndefined());
  });

  test('student → 403', async () => {
    const event = makeEvent({ headers: authHeader(studentPayload) });
    const result = await getUsers(event);
    expect(result.statusCode).toBe(403);
  });
});

// ── getResources ──────────────────────────────────────────────────────────────
describe('getResources', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin → returns all resources including deleted', async () => {
    db.scan.mockResolvedValue({ Items: sampleResources });

    const event = makeEvent({ headers: authHeader(adminPayload) });
    const result = await getResources(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.resources).toHaveLength(3); // includes soft-deleted
  });

  test('student → 403', async () => {
    const event = makeEvent({ headers: authHeader(studentPayload) });
    const result = await getResources(event);
    expect(result.statusCode).toBe(403);
  });
});

// ── adminDeleteResource ───────────────────────────────────────────────────────
describe('adminDeleteResource', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin → hard deletes resource', async () => {
    db.get.mockResolvedValue({ Item: sampleResources[0] });
    db.delete.mockResolvedValue({});
    s3.deleteObject.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader(adminPayload),
      pathParameters: { resourceId: 'r1' },
    });

    const result = await adminDeleteResource(event);
    expect(result.statusCode).toBe(200);
    expect(db.delete).toHaveBeenCalledWith(expect.any(String), { resourceId: 'r1' });
  });

  test('resource not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(adminPayload),
      pathParameters: { resourceId: 'ghost' },
    });

    const result = await adminDeleteResource(event);
    expect(result.statusCode).toBe(404);
  });

  test('student → 403', async () => {
    const event = makeEvent({
      headers: authHeader(studentPayload),
      pathParameters: { resourceId: 'r1' },
    });
    const result = await adminDeleteResource(event);
    expect(result.statusCode).toBe(403);
  });
});

// ── deleteUser ────────────────────────────────────────────────────────────────
describe('deleteUser', () => {
  beforeEach(() => jest.clearAllMocks());

  test('admin deletes another user → success', async () => {
    db.get.mockResolvedValue({ Item: sampleUsers[0] });
    db.delete.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader(adminPayload),
      pathParameters: { userId: 'u1' },
    });

    const result = await deleteUser(event);
    expect(result.statusCode).toBe(200);
    expect(db.delete).toHaveBeenCalledWith(expect.any(String), { userId: 'u1' });
  });

  test('admin cannot delete self → 400', async () => {
    const event = makeEvent({
      headers: authHeader(adminPayload),
      pathParameters: { userId: 'admin1' },
    });

    const result = await deleteUser(event);
    expect(result.statusCode).toBe(400);
    expect(parseBody(result).error).toMatch(/cannot delete your own/i);
  });

  test('user not found → 404', async () => {
    db.get.mockResolvedValue({ Item: null });

    const event = makeEvent({
      headers: authHeader(adminPayload),
      pathParameters: { userId: 'ghost' },
    });

    const result = await deleteUser(event);
    expect(result.statusCode).toBe(404);
  });

  test('student → 403', async () => {
    const event = makeEvent({
      headers: authHeader(studentPayload),
      pathParameters: { userId: 'u1' },
    });
    const result = await deleteUser(event);
    expect(result.statusCode).toBe(403);
  });
});
