const jwt = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// JWT secret — use env variable in all environments.
// In production the secret should be long, random and stored in Secrets Manager.
// ---------------------------------------------------------------------------
const getSecret = () => process.env.JWT_SECRET || 'local-dev-secret-change-in-production';

/**
 * Extract and verify the Bearer token from the event headers.
 * Returns the decoded payload on success, throws on failure.
 */
const verifyToken = async (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, getSecret());
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Require a valid JWT. Returns the decoded user payload.
 */
const requireAuth = async (event) => {
  return verifyToken(event);
};

/**
 * Require a valid JWT belonging to an admin user.
 */
const requireAdmin = async (event) => {
  const user = await verifyToken(event);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
};

/**
 * Sign a JWT for a user record.
 */
const signToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, getSecret(), { expiresIn });

module.exports = { verifyToken, requireAuth, requireAdmin, signToken };
