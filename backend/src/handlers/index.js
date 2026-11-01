'use strict';

/**
 * Barrel export for all Lambda handlers.
 * In production, each handler can be referenced individually in serverless.yml / SAM template.
 */
const auth = require('./auth');
const resources = require('./resources');
const admin = require('./admin');
const shared = require('./shared');
const profile = require('./profile');

module.exports = { auth, resources, admin, shared, profile };
