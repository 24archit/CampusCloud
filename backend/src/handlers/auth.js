'use strict';

const { v4: uuidv4 } = require('uuid');
const { TABLES } = require('../config/constants');
const db = require('../services/dynamodb');
const { requireAuth } = require('../middleware/auth');
const { signToken } = require('../middleware/auth');
const response = require('../utils/response');
const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, validate } = require('../utils/validators');
const { hashPassword, verifyPassword, parseBody, sanitizeUser } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------
/**
 * POST /auth/register
 * Body: { name, email, password }
 */
const register = async (event) => {
  try {
    const body = parseBody(event);
    let data;
    try {
      data = validate(registerSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    const { name, email, password } = data;

    // Check for existing user by scanning (email is not a primary key)
    const existing = await db.scan({
      TableName: TABLES.USERS,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    });

    if (existing.Items && existing.Items.length > 0) {
      return response.error('An account with this email already exists', 409);
    }

    const userId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    const user = {
      userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'student',
      bio: '',
      uploadCount: 0,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    await db.put(TABLES.USERS, user);

    const token = signToken({ userId, email: user.email, name, role: 'student' });

    return response.success({ user: sanitizeUser(user), token }, 201);
  } catch (err) {
    console.error('register error:', err);
    return response.error('Registration failed', 500);
  }
};

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------
/**
 * POST /auth/login
 * Body: { email, password }
 */
const login = async (event) => {
  try {
    const body = parseBody(event);
    let data;
    try {
      data = validate(loginSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    const { email, password } = data;

    // Find user by email
    const result = await db.scan({
      TableName: TABLES.USERS,
      FilterExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email.toLowerCase() },
    });

    if (!result.Items || result.Items.length === 0) {
      return response.error('Invalid email or password', 401);
    }

    const user = result.Items[0];

    if (!verifyPassword(password, user.passwordHash)) {
      return response.error('Invalid email or password', 401);
    }

    // Update lastLoginAt
    const now = new Date().toISOString();
    try {
      await db.update(
        TABLES.USERS,
        { userId: user.userId },
        'SET #lla = :lla',
        { '#lla': 'lastLoginAt' },
        { ':lla': now },
      );
    } catch (updateErr) {
      // Non-critical — log and continue
      console.warn('Could not update lastLoginAt:', updateErr.message);
    }

    const token = signToken({
      userId: user.userId,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return response.success({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('login error:', err);
    return response.error('Login failed', 500);
  }
};

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------
/**
 * GET /auth/profile
 * Requires: Authorization header
 */
const getProfile = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const result = await db.get(TABLES.USERS, { userId: authUser.userId });
    if (!result.Item) {
      return response.error('User not found', 404);
    }

    return response.success({ user: sanitizeUser(result.Item) });
  } catch (err) {
    console.error('getProfile error:', err);
    return response.error('Failed to fetch profile', 500);
  }
};

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
/**
 * PUT /auth/profile
 * Body: { name?, bio? }
 */
const updateProfile = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const body = parseBody(event);
    let data;
    try {
      data = validate(updateProfileSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    if (Object.keys(data).length === 0) {
      return response.error('No fields to update', 400);
    }

    const now = new Date().toISOString();
    const expressionParts = ['#updatedAt = :updatedAt'];
    const names = { '#updatedAt': 'updatedAt' };
    const values = { ':updatedAt': now };

    if (data.name !== undefined) {
      expressionParts.push('#name = :name');
      names['#name'] = 'name';
      values[':name'] = data.name;
    }
    if (data.bio !== undefined) {
      expressionParts.push('#bio = :bio');
      names['#bio'] = 'bio';
      values[':bio'] = data.bio;
    }

    const updated = await db.update(
      TABLES.USERS,
      { userId: authUser.userId },
      `SET ${expressionParts.join(', ')}`,
      names,
      values,
    );

    return response.success({ user: sanitizeUser(updated.Attributes) });
  } catch (err) {
    console.error('updateProfile error:', err);
    return response.error('Failed to update profile', 500);
  }
};

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------
/**
 * POST /auth/change-password
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const body = parseBody(event);
    let data;
    try {
      data = validate(changePasswordSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    const result = await db.get(TABLES.USERS, { userId: authUser.userId });
    if (!result.Item) {
      return response.error('User not found', 404);
    }

    if (!verifyPassword(data.currentPassword, result.Item.passwordHash)) {
      return response.error('Current password is incorrect', 400);
    }

    const newHash = hashPassword(data.newPassword);
    await db.update(
      TABLES.USERS,
      { userId: authUser.userId },
      'SET #ph = :ph, #ua = :ua',
      { '#ph': 'passwordHash', '#ua': 'updatedAt' },
      { ':ph': newHash, ':ua': new Date().toISOString() },
    );

    return response.success({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('changePassword error:', err);
    return response.error('Failed to change password', 500);
  }
};

// ---------------------------------------------------------------------------
// AWS Lambda Dispatcher
// ---------------------------------------------------------------------------
const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path || '';

  if (method === 'POST' && path.endsWith('/register')) return register(event);
  if (method === 'POST' && path.endsWith('/login')) return login(event);
  if (method === 'GET' && path.endsWith('/profile')) return getProfile(event);
  if (method === 'PUT' && path.endsWith('/profile')) return updateProfile(event);
  if (method === 'POST' && path.endsWith('/change-password')) return changePassword(event);

  return response.error('Not Found', 404);
};

module.exports = { register, login, getProfile, updateProfile, changePassword, handler };
