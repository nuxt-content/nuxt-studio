/**
 * Cloudflare R2 list endpoint for Studio OSS integration.
 * Lists all media files uploaded to the studio/ prefix in R2.
 *
 * Required environment variables:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key
 * - R2_SECRET_ACCESS_KEY: R2 API token secret key
 * - R2_BUCKET_NAME: Name of your R2 bucket
 * - R2_PUBLIC_URL: Public URL for the bucket (e.g., https://pub-xxx.r2.dev or custom domain)
 */
import { ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3'
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
          code: 'LIST_FAILED',
          message: 'Missing R2_BUCKET_NAME or R2_PUBLIC_URL environment variables',
        },
      }
    }

    // Get optional query parameters
    const query = getQuery(event)
    let prefix = (query.prefix as string) || 'studio/'
    const maxKeys = Number(query.maxKeys) || 1000
    const continuationToken = query.continuationToken as string | undefined

    // Validate prefix to prevent listing outside studio/
    if (!prefix.startsWith('studio/')) {
      prefix = 'studio/'
    }

    // List objects from R2
    const client = getR2Client()
    const result = await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: maxKeys,
      ContinuationToken: continuationToken,
    }))

    // Map R2 objects to media file format
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      pdf: 'application/pdf',
    }

    const files = await Promise.all((result.Contents || []).map(async (obj) => {
      const key = obj.Key || ''
      const parts = key.split('/')

      // Try to decode parentFsPath from key structure (new format: studio/{encodedPath}/{file})
      // Fall back to HeadObject for legacy files
      let parentFsPath = ''
      if (parts.length >= 3) {
        // New format: decode from key structure
        const encodedPath = parts.slice(1, -1).join('/')
        parentFsPath = encodedPath === '_root_'
          ? ''
          : '/' + encodedPath.replace(/__/g, '/')
      }
      else {
        // Legacy format: try HeadObject for metadata
        try {
          const headResult = await client.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
          }))
          parentFsPath = headResult.Metadata?.['original-parent-path'] || ''
        }
        catch {
          // Metadata not available
        }
      }

      const extension = key.split('.').pop()?.toLowerCase() || ''

      return {
        key,
        parentFsPath,
        url: `${publicUrl}/${key}`,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
        mimeType: mimeTypes[extension] || 'application/octet-stream',
      }
    }))

    return {
      success: true,
      data: {
        files,
        isTruncated: result.IsTruncated || false,
        nextContinuationToken: result.NextContinuationToken,
      },
    }
  }
  catch (error) {
    console.error('[Studio R2] List error:', error)
    return {
      success: false,
      error: {
        code: 'LIST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
})
