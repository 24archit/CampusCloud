'use strict';

const { TABLES } = require('../config/constants');
const db = require('../services/dynamodb');
const s3 = require('../services/s3');
const { requireAdmin } = require('../middleware/auth');
const response = require('../utils/response');
const { sanitizeUser, parseBody } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// getStats
// ---------------------------------------------------------------------------
/**
 * GET /admin/stats
 * Admin only.
 */
const getStats = async (event) => {
  try {
    try {
      await requireAdmin(event);
    } catch (err) {
      const status = err.message === 'Admin access required' ? 403 : 401;
      return response.error(err.message, status);
    }

    const [usersResult, resourcesResult] = await Promise.all([
      db.scan({ TableName: TABLES.USERS }),
      db.scan({ TableName: TABLES.RESOURCES }),
    ]);

    const users = usersResult.Items || [];
    const resources = resourcesResult.Items || [];

    const activeResources = resources.filter((r) => !r.isDeleted);
    const totalStorageBytes = activeResources.reduce((sum, r) => sum + (r.fileSize || 0), 0);

    // Resources by category
    const resourcesByCategory = activeResources.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    }, {});

    // Uploads this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const uploadsThisMonth = activeResources.filter((r) => r.createdAt >= startOfMonth).length;

    return response.success({
      totalUsers: users.length,
      totalResources: activeResources.length,
      totalStorageBytes,
      resourcesByCategory,
      uploadsThisMonth,
    });
  } catch (err) {
    console.error('getStats error:', err);
    return response.error('Failed to fetch stats', 500);
  }
};

// ---------------------------------------------------------------------------
// getUsers
// ---------------------------------------------------------------------------
/**
 * GET /admin/users
 * Admin only.
 */
const getUsers = async (event) => {
  try {
    try {
      await requireAdmin(event);
    } catch (err) {
      const status = err.message === 'Admin access required' ? 403 : 401;
      return response.error(err.message, status);
    }

    const result = await db.scan({ TableName: TABLES.USERS });
    const users = (result.Items || []).map(sanitizeUser);

    return response.success({ users, total: users.length });
  } catch (err) {
    console.error('getUsers error:', err);
    return response.error('Failed to fetch users', 500);
  }
};

// ---------------------------------------------------------------------------
// getResources
// ---------------------------------------------------------------------------
/**
 * GET /admin/resources
 * Admin only. Returns all resources including soft-deleted ones.
 */
const getResources = async (event) => {
  try {
    try {
      await requireAdmin(event);
    } catch (err) {
      const status = err.message === 'Admin access required' ? 403 : 401;
      return response.error(err.message, status);
    }

    const result = await db.scan({ TableName: TABLES.RESOURCES });
    const resources = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return response.success({ resources, total: resources.length });
  } catch (err) {
    console.error('getResources error:', err);
    return response.error('Failed to fetch resources', 500);
  }
};

// ---------------------------------------------------------------------------
// adminDeleteResource
// ---------------------------------------------------------------------------
/**
 * DELETE /admin/resources/{resourceId}
 * Hard delete from DynamoDB and S3.
 */
const adminDeleteResource = async (event) => {
  try {
    try {
      await requireAdmin(event);
    } catch (err) {
      const status = err.message === 'Admin access required' ? 403 : 401;
      return response.error(err.message, status);
    }

    const resourceId = event.pathParameters?.resourceId;
    if (!resourceId) return response.error('Resource ID is required', 400);

    const result = await db.get(TABLES.RESOURCES, { resourceId });
    if (!result.Item) {
      return response.error('Resource not found', 404);
    }

    const resource = result.Item;

    // Hard delete from DynamoDB
    await db.delete(TABLES.RESOURCES, { resourceId });

    // Delete from S3 (best effort)
    try {
      await s3.deleteObject(resource.s3Key);
    } catch (err) {
      console.warn('Failed to delete S3 object:', err.message);
    }

    return response.success({ message: 'Resource permanently deleted' });
  } catch (err) {
    console.error('adminDeleteResource error:', err);
    return response.error('Failed to delete resource', 500);
  }
};

// ---------------------------------------------------------------------------
// deleteUser
// ---------------------------------------------------------------------------
/**
 * DELETE /admin/users/{userId}
 * Admin only. Cannot delete self.
 */
const deleteUser = async (event) => {
  try {
    let adminUser;
    try {
      adminUser = await requireAdmin(event);
    } catch (err) {
      const status = err.message === 'Admin access required' ? 403 : 401;
      return response.error(err.message, status);
    }

    const userId = event.pathParameters?.userId;
    if (!userId) return response.error('User ID is required', 400);

    if (userId === adminUser.userId) {
      return response.error('You cannot delete your own account', 400);
    }

    const result = await db.get(TABLES.USERS, { userId });
    if (!result.Item) {
      return response.error('User not found', 404);
    }

    await db.delete(TABLES.USERS, { userId });

    return response.success({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('deleteUser error:', err);
    return response.error('Failed to delete user', 500);
  }
};

// ---------------------------------------------------------------------------
// AWS Lambda Dispatcher
// ---------------------------------------------------------------------------
const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path || '';

  if (method === 'GET' && path.endsWith('/stats')) return getStats(event);
  if (method === 'GET' && path.endsWith('/users')) return getUsers(event);
  if (method === 'GET' && path.endsWith('/resources')) return getResources(event);
  if (method === 'DELETE' && event.pathParameters?.resourceId) return adminDeleteResource(event);
  if (method === 'DELETE' && event.pathParameters?.userId) return deleteUser(event);

  return response.error('Not Found', 404);
};

module.exports = { getStats, getUsers, getResources, adminDeleteResource, deleteUser, handler };
