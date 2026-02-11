/**
 * Cloudflare R2 delete endpoint for Studio OSS integration.
 * Deletes a file from R2 by its storage key.
 *
 * Required environment variables:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key
 * - R2_SECRET_ACCESS_KEY: R2 API token secret key
 * - R2_BUCKET_NAME: Name of your R2 bucket
 */
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getR2Client, getR2Config } from '../utils/r2-client'
import { requireStudioAuth } from '../utils/studio-auth'

export default defineEventHandler(async (event) => {
  // Verify authentication
  await requireStudioAuth(event)

  try {
    // Validate environment
    const { bucketName } = getR2Config()

    if (!bucketName) {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Missing R2_BUCKET_NAME environment variable',
        },
      }
    }

    // Get the key from request body
    const body = await readBody(event)
    const { key } = body

    // Validate key parameter
    if (!key || typeof key !== 'string') {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Missing key parameter',
        },
      }
    }

    // Prevent path traversal attacks - only allow files in studio/ prefix
    if (!key.startsWith('studio/') || key.includes('..')) {
      return {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Invalid key: must be in studio/ prefix and cannot contain path traversal',
        },
      }
    }

    // Delete from R2
    const client = getR2Client()
    await client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }))

    return {
      success: true,
      data: {
        key,
        deletedAt: new Date().toISOString(),
      },
    }
  }
  catch (error) {
    console.error('[Studio R2] Delete error:', error)
    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
})
