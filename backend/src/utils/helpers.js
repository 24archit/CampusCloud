const crypto = require('crypto');

/**
 * Hash a plain-text password using PBKDF2.
 * Returns "salt:hash" string.
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Verify a plain-text password against a stored "salt:hash" string.
 */
const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

/**
 * Sanitise a filename: remove unsafe characters, keep extension.
 */
const sanitizeFilename = (filename) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_');

/**
 * Parse a JSON body string from a Lambda event.
 * Returns empty object on failure.
 */
const parseBody = (event) => {
  try {
    if (!event.body) return {};
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return {};
  }
};

/**
 * Extract query string parameters with defaults.
 */
const getQueryParams = (event) => event.queryStringParameters || {};

/**
 * Build a safe user object that omits credential fields.
 */
const sanitizeUser = (user) => {
  const { passwordHash, ...safe } = user;
  return safe;
};

/**
 * Calculate Unix epoch seconds N hours from now (for DynamoDB TTL).
 */
const ttlFromNow = (hours) => Math.floor(Date.now() / 1000) + hours * 3600;

module.exports = {
  hashPassword,
  verifyPassword,
  sanitizeFilename,
  parseBody,
  getQueryParams,
  sanitizeUser,
  ttlFromNow,
};
