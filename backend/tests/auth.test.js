'use strict';

/**
 * tests/auth.test.js
 * Unit tests for src/handlers/auth.js
 * All AWS SDK calls are mocked.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../src/services/dynamodb');
jest.mock('../src/services/s3');

const db = require('../src/services/dynamodb');

// We need a real JWT to test token verification
const jwt = require('jsonwebtoken');
const SECRET = 'local-dev-secret-change-in-production';
process.env.JWT_SECRET = SECRET;

const { register, login, getProfile, updateProfile, changePassword } = require('../src/handlers/auth');

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

const parseBody = (result) => JSON.parse(result.body);

// ── register ─────────────────────────────────────────────────────────────────
describe('register', () => {
  beforeEach(() => jest.clearAllMocks());

  test('success — creates user and returns token', async () => {
    db.scan.mockResolvedValue({ Items: [] });
    db.put.mockResolvedValue({});

    const event = makeEvent({
      body: JSON.stringify({ name: 'Alice Smith', email: 'alice@test.com', password: 'Password1!' }),
    });

    const result = await register(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('alice@test.com');
    expect(body.data.user.role).toBe('student');
    expect(body.data.user.passwordHash).toBeUndefined();
    expect(typeof body.data.token).toBe('string');
  });

  test('validation error — missing name', async () => {
    const event = makeEvent({
      body: JSON.stringify({ email: 'alice@test.com', password: 'Password1!' }),
    });
    const result = await register(event);
    expect(result.statusCode).toBe(400);
    expect(parseBody(result).success).toBe(false);
  });

  test('validation error — invalid email', async () => {
    const event = makeEvent({
      body: JSON.stringify({ name: 'Alice', email: 'not-an-email', password: 'Password1!' }),
    });
    const result = await register(event);
    expect(result.statusCode).toBe(400);
  });

  test('validation error — password too short', async () => {
    const event = makeEvent({
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'short' }),
    });
    const result = await register(event);
    expect(result.statusCode).toBe(400);
  });

  test('duplicate email → 409', async () => {
    db.scan.mockResolvedValue({
      Items: [{ userId: 'existing', email: 'alice@test.com' }],
    });

    const event = makeEvent({
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'Password1!' }),
    });
    const result = await register(event);
    expect(result.statusCode).toBe(409);
    expect(parseBody(result).error).toMatch(/already exists/i);
  });

  test('DynamoDB failure → 500', async () => {
    db.scan.mockRejectedValue(new Error('DynamoDB connection error'));
    const event = makeEvent({
      body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'Password1!' }),
    });
    const result = await register(event);
    expect(result.statusCode).toBe(500);
  });
});

// ── login ─────────────────────────────────────────────────────────────────────
describe('login', () => {
  const { hashPassword } = require('../src/utils/helpers');

  beforeEach(() => jest.clearAllMocks());

  test('success — returns token', async () => {
    const passwordHash = hashPassword('Password1!');
    db.scan.mockResolvedValue({
      Items: [{ userId: 'u1', name: 'Alice', email: 'alice@test.com', passwordHash, role: 'student' }],
    });
    db.update.mockResolvedValue({});

    const event = makeEvent({
      body: JSON.stringify({ email: 'alice@test.com', password: 'Password1!' }),
    });
    const result = await login(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  test('wrong password → 401', async () => {
    const passwordHash = hashPassword('Password1!');
    db.scan.mockResolvedValue({
      Items: [{ userId: 'u1', email: 'alice@test.com', passwordHash, role: 'student' }],
    });

    const event = makeEvent({
      body: JSON.stringify({ email: 'alice@test.com', password: 'WrongPass99' }),
    });
    const result = await login(event);
    expect(result.statusCode).toBe(401);
  });

  test('non-existent email → 401', async () => {
    db.scan.mockResolvedValue({ Items: [] });
    const event = makeEvent({
      body: JSON.stringify({ email: 'nobody@test.com', password: 'Password1!' }),
    });
    const result = await login(event);
    expect(result.statusCode).toBe(401);
  });

  test('missing fields → 400', async () => {
    const event = makeEvent({ body: JSON.stringify({ email: 'alice@test.com' }) });
    const result = await login(event);
    expect(result.statusCode).toBe(400);
  });
});

// ── getProfile ────────────────────────────────────────────────────────────────
describe('getProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('valid token → returns user (no passwordHash)', async () => {
    const user = { userId: 'u1', name: 'Alice', email: 'alice@test.com', role: 'student', passwordHash: 'x' };
    db.get.mockResolvedValue({ Item: user });

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'alice@test.com', name: 'Alice', role: 'student' }),
    });
    const result = await getProfile(event);
    const body = parseBody(result);

    expect(result.statusCode).toBe(200);
    expect(body.data.user.name).toBe('Alice');
    expect(body.data.user.passwordHash).toBeUndefined();
  });

  test('invalid token → 401', async () => {
    const event = makeEvent({
      headers: { Authorization: 'Bearer bad-token' },
    });
    const result = await getProfile(event);
    expect(result.statusCode).toBe(401);
  });

  test('no token → 401', async () => {
    const result = await getProfile(makeEvent());
    expect(result.statusCode).toBe(401);
  });

  test('user not found in DynamoDB → 404', async () => {
    db.get.mockResolvedValue({ Item: null });
    const event = makeEvent({
      headers: authHeader({ userId: 'ghost', email: 'ghost@test.com', name: 'Ghost', role: 'student' }),
    });
    const result = await getProfile(event);
    expect(result.statusCode).toBe(404);
  });
});

// ── updateProfile ─────────────────────────────────────────────────────────────
describe('updateProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  test('updates name and bio', async () => {
    db.update.mockResolvedValue({
      Attributes: { userId: 'u1', name: 'Bob', bio: 'CS student', email: 'bob@test.com', role: 'student' },
    });

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'bob@test.com', name: 'Bob', role: 'student' }),
      body: JSON.stringify({ name: 'Bob', bio: 'CS student' }),
    });
    const result = await updateProfile(event);
    expect(result.statusCode).toBe(200);
    expect(parseBody(result).data.user.bio).toBe('CS student');
  });

  test('no fields → 400', async () => {
    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'bob@test.com', name: 'Bob', role: 'student' }),
      body: JSON.stringify({}),
    });
    const result = await updateProfile(event);
    expect(result.statusCode).toBe(400);
  });
});

// ── changePassword ────────────────────────────────────────────────────────────
describe('changePassword', () => {
  const { hashPassword } = require('../src/utils/helpers');

  beforeEach(() => jest.clearAllMocks());

  test('correct current password → success', async () => {
    db.get.mockResolvedValue({ Item: { userId: 'u1', passwordHash: hashPassword('OldPass1!') } });
    db.update.mockResolvedValue({});

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'bob@test.com', name: 'Bob', role: 'student' }),
      body: JSON.stringify({ currentPassword: 'OldPass1!', newPassword: 'NewPass1!' }),
    });
    const result = await changePassword(event);
    expect(result.statusCode).toBe(200);
  });

  test('wrong current password → 400', async () => {
    db.get.mockResolvedValue({ Item: { userId: 'u1', passwordHash: hashPassword('OldPass1!') } });

    const event = makeEvent({
      headers: authHeader({ userId: 'u1', email: 'bob@test.com', name: 'Bob', role: 'student' }),
      body: JSON.stringify({ currentPassword: 'WrongPass!', newPassword: 'NewPass1!' }),
    });
    const result = await changePassword(event);
    expect(result.statusCode).toBe(400);
  });
});
