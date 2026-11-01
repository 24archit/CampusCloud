const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resourceSchema = z.object({
  resourceId: z.string().uuid('Invalid resourceId'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().default(''),
  subject: z.string().min(1, 'Subject is required').max(100),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional().default([]),
  s3Key: z.string().min(1, 'S3 key is required'),
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive'),
});

const uploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().min(1, 'File type is required'),
  fileSize: z.number().positive('File size must be positive'),
  title: z.string().min(1, 'Title is required').max(200),
  subject: z.string().min(1, 'Subject is required').max(100),
  category: z.string().min(1, 'Category is required'),
  description: z.string().max(2000).optional().default(''),
  tags: z.array(z.string()).optional().default([]),
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * Validate data against a Zod schema. Throws a descriptive error on failure.
 */
const validate = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw Object.assign(new Error(messages), { isValidationError: true, details: result.error.errors });
  }
  return result.data;
};

module.exports = {
  registerSchema,
  loginSchema,
  resourceSchema,
  uploadUrlSchema,
  updateProfileSchema,
  changePasswordSchema,
  validate,
};
