const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Return a successful Lambda response.
 * @param {*} data - Response payload
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (data, statusCode = 200) => ({
  statusCode,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify({ success: true, data }),
});

/**
 * Return an error Lambda response.
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {*} details - Optional additional details
 */
const error = (message, statusCode = 400, details = null) => ({
  statusCode,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify({ success: false, error: message, details }),
});

/**
 * Return a paginated Lambda response.
 */
const paginated = (items, total, page, limit) => ({
  statusCode: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    success: true,
    data: {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }),
});

module.exports = { success, error, paginated };
