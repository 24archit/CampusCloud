'use strict';

const { TABLES } = require('../config/constants');
const db = require('../services/dynamodb');
const s3 = require('../services/s3');
const response = require('../utils/response');

// ---------------------------------------------------------------------------
// getSharedResource
// ---------------------------------------------------------------------------
/**
 * GET /shared/{shareId}
 * Public endpoint — no auth required.
 */
const getSharedResource = async (event) => {
  try {
    const shareId = event.pathParameters?.shareId;
    if (!shareId) return response.error('Share ID is required', 400);

    // Fetch share link record
    const linkResult = await db.get(TABLES.SHARED_LINKS, { shareId });
    if (!linkResult.Item) {
      return response.error('Shared link not found or has expired', 404);
    }

    const link = linkResult.Item;

    // Check expiry
    if (new Date(link.expiresAt) < new Date()) {
      return response.error('This shared link has expired', 410);
    }

    // Fetch the resource
    const resourceResult = await db.get(TABLES.RESOURCES, { resourceId: link.resourceId });
    if (!resourceResult.Item || resourceResult.Item.isDeleted) {
      return response.error('Resource not found', 404);
    }

    const resource = resourceResult.Item;

    // Generate a download URL
    const downloadUrl = await s3.getDownloadPresignedUrl(resource.s3Key, resource.fileName);

    return response.success({ resource, downloadUrl });
  } catch (err) {
    console.error('getSharedResource error:', err);
    return response.error('Failed to fetch shared resource', 500);
  }
};

module.exports = { getSharedResource, handler: getSharedResource };
