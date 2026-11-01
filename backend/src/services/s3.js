const fs = require('fs');
const path = require('path');
const { S3Client, DeleteObjectCommand, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const useLocal = process.env.LOCAL_DEV === 'true' || (!process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_PORT = process.env.PORT || 3001;
const getBaseUrl = () => {
  return process.env.API_URL || process.env.RENDER_EXTERNAL_URL || process.env.LOCAL_API_HOST || `http://localhost:${process.env.PORT || 3001}`;
};

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

/**
 * Generate a pre-signed URL to allow the client to upload a file directly to S3 (or local store).
 * Valid for 5 minutes.
 */
const getUploadPresignedUrl = async (key, contentType, fileSize) => {
  if (useLocal) {
    return `${getBaseUrl()}/api/local-storage/upload/${encodeURIComponent(key)}`;
  }
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET || 'campus-cloud-resources-bucket',
    Key: key,
    ContentType: contentType,
    ContentLength: fileSize,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
};

/**
 * Generate a pre-signed URL to allow the client to download a file from S3 (or local store).
 * Valid for 1 hour.
 */
const getDownloadPresignedUrl = async (key, filename) => {
  if (useLocal) {
    return `${getBaseUrl()}/api/local-storage/download/${encodeURIComponent(key)}?filename=${encodeURIComponent(filename || 'download')}`;
  }
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET || 'campus-cloud-resources-bucket',
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
};

/**
 * Delete an object from S3 (or local store).
 */
const deleteObject = async (key) => {
  if (useLocal) {
    const uploadsDir = path.join(__dirname, '../../local-dev/uploads');
    const safeFile = path.join(uploadsDir, key.replace(/[/\\?%*:|"<>]/g, '_'));
    if (fs.existsSync(safeFile)) {
      try { fs.unlinkSync(safeFile); } catch {}
    }
    return {};
  }
  return s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET || 'campus-cloud-resources-bucket',
      Key: key,
    }),
  );
};

module.exports = { getUploadPresignedUrl, getDownloadPresignedUrl, deleteObject };
