module.exports = {
  TABLES: {
    USERS: process.env.USERS_TABLE || 'campus-cloud-users',
    RESOURCES: process.env.RESOURCES_TABLE || 'campus-cloud-resources',
    SHARED_LINKS: process.env.SHARED_LINKS_TABLE || 'campus-cloud-shared-links',
  },
  S3: {
    BUCKET: process.env.S3_BUCKET || 'campus-cloud-resources-bucket',
    PRESIGNED_URL_EXPIRY: 3600, // 1 hour
    MAX_FILE_SIZE: 52428800, // 50MB
    ALLOWED_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ],
  },
  COGNITO: {
    USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
    CLIENT_ID: process.env.COGNITO_CLIENT_ID,
    REGION: process.env.AWS_REGION || 'ap-south-1',
  },
  SHARED_LINK: {
    TTL_HOURS: 72, // 3 days
  },
  CATEGORIES: [
    'Notes', 'Assignments', 'Projects', 'Research Papers',
    'Presentations', 'Lab Manuals', 'Previous Year Papers', 'Books', 'Other',
  ],
};
