'use strict';

const { v4: uuidv4 } = require('uuid');
const { TABLES, S3: S3_CONFIG } = require('../config/constants');
const db = require('../services/dynamodb');
const s3 = require('../services/s3');
const { requireAuth } = require('../middleware/auth');
const response = require('../utils/response');
const { uploadUrlSchema, resourceSchema, validate } = require('../utils/validators');
const { parseBody, getQueryParams, sanitizeFilename, ttlFromNow } = require('../utils/helpers');

// ---------------------------------------------------------------------------
// getUploadUrl
// ---------------------------------------------------------------------------
/**
 * POST /resources/upload-url
 * Body: { fileName, fileType, fileSize, title, subject, category, description?, tags? }
 */
const getUploadUrl = async (event) => {
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
      data = validate(uploadUrlSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    const { fileName, fileType, fileSize } = data;

    // Validate file type
    if (!S3_CONFIG.ALLOWED_TYPES.includes(fileType)) {
      return response.error(
        `File type not allowed. Allowed: ${S3_CONFIG.ALLOWED_TYPES.join(', ')}`,
        400,
      );
    }

    // Validate file size
    if (fileSize > S3_CONFIG.MAX_FILE_SIZE) {
      return response.error(
        `File too large. Maximum size is ${S3_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB`,
        400,
      );
    }

    const resourceId = uuidv4();
    const sanitized = sanitizeFilename(fileName);
    const s3Key = `resources/${authUser.userId}/${resourceId}-${sanitized}`;

    const uploadUrl = await s3.getUploadPresignedUrl(s3Key, fileType, fileSize);

    return response.success({ uploadUrl, s3Key, resourceId });
  } catch (err) {
    console.error('getUploadUrl error:', err);
    return response.error('Failed to generate upload URL', 500);
  }
};

// ---------------------------------------------------------------------------
// createResource
// ---------------------------------------------------------------------------
/**
 * POST /resources
 * Body: { resourceId, title, description, subject, category, tags, s3Key, fileName, fileType, fileSize }
 */
const createResource = async (event) => {
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
      data = validate(resourceSchema, body);
    } catch (err) {
      return response.error(err.message, 400, err.details || null);
    }

    const now = new Date().toISOString();
    const resource = {
      resourceId: data.resourceId,
      title: data.title,
      description: data.description || '',
      subject: data.subject,
      category: data.category,
      tags: data.tags || [],
      s3Key: data.s3Key,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      uploaderId: authUser.userId,
      uploaderName: authUser.name,
      uploaderEmail: authUser.email,
      downloadCount: 0,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await db.put(TABLES.RESOURCES, resource);

    // Increment the uploader's uploadCount
    try {
      await db.update(
        TABLES.USERS,
        { userId: authUser.userId },
        'SET #uc = if_not_exists(#uc, :zero) + :one',
        { '#uc': 'uploadCount' },
        { ':zero': 0, ':one': 1 },
      );
    } catch (err) {
      console.warn('Failed to increment uploadCount:', err.message);
    }

    return response.success({ resource }, 201);
  } catch (err) {
    console.error('createResource error:', err);
    return response.error('Failed to create resource', 500);
  }
};

// ---------------------------------------------------------------------------
// listResources
// ---------------------------------------------------------------------------
/**
 * GET /resources
 * Query: page, limit, search, category, subject, fileType, sortBy
 */
const listResources = async (event) => {
  try {
    try {
      await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const params = getQueryParams(event);
    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit || '10', 10)));
    const search = (params.search || '').toLowerCase().trim();
    const category = params.category || '';
    const subject = params.subject || '';
    const fileType = params.fileType || '';
    const sortBy = params.sortBy || 'latest';

    // Scan the resources table
    const result = await db.scan({
      TableName: TABLES.RESOURCES,
      FilterExpression: '#del = :false',
      ExpressionAttributeNames: { '#del': 'isDeleted' },
      ExpressionAttributeValues: { ':false': false },
    });

    let items = result.Items || [];

    // Apply filters
    if (search) {
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(search) ||
          (r.description || '').toLowerCase().includes(search) ||
          r.subject.toLowerCase().includes(search),
      );
    }
    if (category) items = items.filter((r) => r.category === category);
    if (subject) items = items.filter((r) => r.subject.toLowerCase().includes(subject.toLowerCase()));
    if (fileType) items = items.filter((r) => r.fileType === fileType);

    // Sort
    switch (sortBy) {
      case 'downloads':
        items.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0));
        break;
      case 'alphabetical':
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'latest':
      default:
        items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = items.length;
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return response.paginated(paginatedItems, total, page, limit);
  } catch (err) {
    console.error('listResources error:', err);
    return response.error('Failed to list resources', 500);
  }
};

// ---------------------------------------------------------------------------
// getResource
// ---------------------------------------------------------------------------
/**
 * GET /resources/{resourceId}
 */
const getResource = async (event) => {
  try {
    try {
      await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const resourceId = event.pathParameters?.resourceId;
    if (!resourceId) return response.error('Resource ID is required', 400);

    const result = await db.get(TABLES.RESOURCES, { resourceId });
    if (!result.Item || result.Item.isDeleted) {
      return response.error('Resource not found', 404);
    }

    return response.success({ resource: result.Item });
  } catch (err) {
    console.error('getResource error:', err);
    return response.error('Failed to fetch resource', 500);
  }
};

// ---------------------------------------------------------------------------
// downloadResource
// ---------------------------------------------------------------------------
/**
 * GET /resources/{resourceId}/download
 */
const downloadResource = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const resourceId = event.pathParameters?.resourceId;
    if (!resourceId) return response.error('Resource ID is required', 400);

    const result = await db.get(TABLES.RESOURCES, { resourceId });
    if (!result.Item || result.Item.isDeleted) {
      return response.error('Resource not found', 404);
    }

    const resource = result.Item;

    // Increment download count (best effort)
    try {
      await db.update(
        TABLES.RESOURCES,
        { resourceId },
        'SET #dc = if_not_exists(#dc, :zero) + :one',
        { '#dc': 'downloadCount' },
        { ':zero': 0, ':one': 1 },
      );
    } catch (err) {
      console.warn('Failed to increment downloadCount:', err.message);
    }

    const downloadUrl = await s3.getDownloadPresignedUrl(resource.s3Key, resource.fileName);

    return response.success({ downloadUrl, fileName: resource.fileName });
  } catch (err) {
    console.error('downloadResource error:', err);
    return response.error('Failed to generate download URL', 500);
  }
};

// ---------------------------------------------------------------------------
// deleteResource
// ---------------------------------------------------------------------------
/**
 * DELETE /resources/{resourceId}
 */
const deleteResource = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const resourceId = event.pathParameters?.resourceId;
    if (!resourceId) return response.error('Resource ID is required', 400);

    const result = await db.get(TABLES.RESOURCES, { resourceId });
    if (!result.Item || result.Item.isDeleted) {
      return response.error('Resource not found', 404);
    }

    const resource = result.Item;

    // Only the owner can delete
    if (resource.uploaderId !== authUser.userId) {
      return response.error('You are not authorized to delete this resource', 403);
    }

    // Soft-delete in DynamoDB
    await db.update(
      TABLES.RESOURCES,
      { resourceId },
      'SET #del = :true, #ua = :ua',
      { '#del': 'isDeleted', '#ua': 'updatedAt' },
      { ':true': true, ':ua': new Date().toISOString() },
    );

    // Delete from S3 (best effort)
    try {
      await s3.deleteObject(resource.s3Key);
    } catch (err) {
      console.warn('Failed to delete S3 object:', err.message);
    }

    // Decrement user uploadCount
    try {
      await db.update(
        TABLES.USERS,
        { userId: authUser.userId },
        'SET #uc = if_not_exists(#uc, :one) - :one',
        { '#uc': 'uploadCount' },
        { ':one': 1 },
      );
    } catch (err) {
      console.warn('Failed to decrement uploadCount:', err.message);
    }

    return response.success({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('deleteResource error:', err);
    return response.error('Failed to delete resource', 500);
  }
};

// ---------------------------------------------------------------------------
// getMyUploads
// ---------------------------------------------------------------------------
/**
 * GET /resources/my-uploads
 */
const getMyUploads = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const result = await db.scan({
      TableName: TABLES.RESOURCES,
      FilterExpression: '#uid = :uid AND #del = :false',
      ExpressionAttributeNames: { '#uid': 'uploaderId', '#del': 'isDeleted' },
      ExpressionAttributeValues: { ':uid': authUser.userId, ':false': false },
    });

    const items = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );

    return response.success({ items, resources: items, total: items.length });
  } catch (err) {
    console.error('getMyUploads error:', err);
    return response.error('Failed to fetch uploads', 500);
  }
};

// ---------------------------------------------------------------------------
// createShareLink
// ---------------------------------------------------------------------------
/**
 * POST /resources/{resourceId}/share
 */
const createShareLink = async (event) => {
  try {
    let authUser;
    try {
      authUser = await requireAuth(event);
    } catch (err) {
      return response.error(err.message, 401);
    }

    const resourceId = event.pathParameters?.resourceId;
    if (!resourceId) return response.error('Resource ID is required', 400);

    const result = await db.get(TABLES.RESOURCES, { resourceId });
    if (!result.Item || result.Item.isDeleted) {
      return response.error('Resource not found', 404);
    }

    const shareId = uuidv4();
    const now = new Date().toISOString();
    const TTL_HOURS = 72;
    const expiresAtEpoch = ttlFromNow(TTL_HOURS);
    const expiresAt = new Date(expiresAtEpoch * 1000).toISOString();

    await db.put(TABLES.SHARED_LINKS, {
      shareId,
      resourceId,
      createdBy: authUser.userId,
      expiresAt,
      expiresAtEpoch, // for DynamoDB TTL
      createdAt: now,
    });

    const origin = event.headers?.origin || event.headers?.Origin;
    const frontendUrl = origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const shareLink = `${frontendUrl}/shared/${shareId}`;

    return response.success({ shareLink, shareId, expiresAt }, 201);
  } catch (err) {
    console.error('createShareLink error:', err);
    return response.error('Failed to create share link', 500);
  }
};

// ---------------------------------------------------------------------------
// AWS Lambda Dispatcher
// ---------------------------------------------------------------------------
const handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path || '';

  if (method === 'POST' && path.endsWith('/upload-url')) return getUploadUrl(event);
  if (method === 'POST' && path.endsWith('/share')) return createShareLink(event);
  if (method === 'POST' && (path.endsWith('/resources') || path.endsWith('/resources/'))) return createResource(event);
  if (method === 'GET' && path.endsWith('/my-uploads')) return getMyUploads(event);
  if (method === 'GET' && path.endsWith('/download')) return downloadResource(event);
  if (method === 'GET' && event.pathParameters?.resourceId) return getResource(event);
  if (method === 'DELETE' && event.pathParameters?.resourceId) return deleteResource(event);
  if (method === 'GET' && (path.endsWith('/resources') || path.endsWith('/resources/'))) return listResources(event);

  return response.error('Not Found', 404);
};

module.exports = {
  getUploadUrl,
  createResource,
  listResources,
  getResource,
  downloadResource,
  deleteResource,
  getMyUploads,
  createShareLink,
  handler,
};
