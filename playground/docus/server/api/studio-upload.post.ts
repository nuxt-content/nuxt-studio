/**
 * Cloudflare R2 upload endpoint for Studio OSS integration.
 *
 * Required environment variables:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key
 * - R2_SECRET_ACCESS_KEY: R2 API token secret key
 * - R2_BUCKET_NAME: Name of your R2 bucket
 * - R2_PUBLIC_URL: Public URL for the bucket (e.g., https://pub-xxx.r2.dev or custom domain)
 */
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { readMultipartFormData } from 'h3'
import { getR2Client, getR2Config } from '../utils/r2-client'
import { requireStudioAuth } from '../utils/studio-auth'

export default defineEventHandler(async (event) => {
  // Verify authentication
  await requireStudioAuth(event)

  try {
    // Validate environment
    const { bucketName, publicUrl } = getR2Config()

    if (!bucketName || !publicUrl) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Missing R2_BUCKET_NAME or R2_PUBLIC_URL environment variables',
        },
      }
    }

    // Parse multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'No file provided',
        },
      }
    }

    const file = formData.find(f => f.name === 'file')
    const parentFsPathField = formData.find(f => f.name === 'parentFsPath')
    const parentFsPath = parentFsPathField?.data?.toString() || ''

    if (!file || !file.data) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'File field not found',
        },
      }
    }

    // Server-side validation (best practice - don't rely only on client-side validation)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ['image/', 'video/', 'audio/']

    if (file.data.length > MAX_FILE_SIZE) {
      return {
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size ${Math.round(file.data.length / 1024 / 1024)}MB exceeds maximum of 10MB`,
        },
      }
    }

    if (file.type && !ALLOWED_TYPES.some(t => file.type?.startsWith(t))) {
      return {
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: `File type "${file.type}" is not allowed. Allowed types: images, videos, audio`,
        },
      }
    }

    // Generate a unique filename
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const originalName = file.filename || 'upload'

    // Extract extension robustly
    const lastDotIndex = originalName.lastIndexOf('.')
    const extension = lastDotIndex > 0
      ? originalName.slice(lastDotIndex + 1).toLowerCase()
      : 'bin'

    // Encode parentFsPath in the R2 key structure for efficient listing
    // Format: studio/{encodedParentPath}/{timestamp}-{randomId}.{ext}
    const safePath = parentFsPath
      ? parentFsPath.replace(/^\//, '').replace(/\//g, '__')
      : '_root_'
    const filename = `studio/${safePath}/${timestamp}-${randomId}.${extension}`

    // Upload to R2
    const client = getR2Client()
    await client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: file.data,
      ContentType: file.type || 'application/octet-stream',
    }))

    // Build public URL
    const url = `${publicUrl}/${filename}`

    return {
      success: true,
      data: {
        url,
        filename: originalName,
        mimeType: file.type || 'application/octet-stream',
        size: file.data.length,
        alt: originalName.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        metadata: {
          provider: 'cloudflare-r2',
          bucket: bucketName,
          key: filename,
          parentFsPath,
          uploadedAt: new Date().toISOString(),
        },
      },
    }
  }
  catch (error) {
    console.error('[Studio R2] Upload error:', error)
    return {
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
})
