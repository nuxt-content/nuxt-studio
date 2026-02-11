import { S3Client } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null

/**
 * Get or create a singleton S3 client for R2.
 * Lazily initialized on first request.
 */
export function getR2Client(): S3Client {
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID
    const accessKeyId = process.env.R2_ACCESS_KEY_ID
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.')
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }
  return s3Client
}

/**
 * Get R2 bucket configuration from environment variables.
 */
export function getR2Config() {
  const bucketName = process.env.R2_BUCKET_NAME
  const publicUrl = process.env.R2_PUBLIC_URL

  return {
    bucketName,
    publicUrl: publicUrl?.replace(/\/$/, ''),
  }
}
