'use strict';

/**
 * src/handlers/profile.js
 *
 * Thin re-export of profile-related auth handlers.
 * Keeps the local dev server and API Gateway route mapping clean.
 */
const { getProfile, updateProfile, changePassword } = require('./auth');

module.exports = { getProfile, updateProfile, changePassword };
