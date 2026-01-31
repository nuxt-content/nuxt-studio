import type { BaseItem } from './item'

export interface MediaItem extends BaseItem {
  [key: string]: unknown
  /** Base64 data URL for local files */
  raw?: string
  /** External URL if stored in OSS (Object Storage Service) */
  ossUrl?: string
  /** Storage key in OSS provider (used for matching after refresh) */
  ossKey?: string
  /** Metadata from OSS provider */
  ossMetadata?: Record<string, unknown>
}

/**
 * Check if a media item is stored in an external OSS provider
 */
export function isOSSMedia(item: MediaItem): boolean {
  return !!item.ossUrl
}

/**
 * Result returned by a successful OSS upload
 */
export interface OSSUploadResult {
  /** The public URL of the uploaded file */
  url: string
  /** Alt text / description for the file */
  alt?: string
  /** Original filename */
  filename: string
  /** File MIME type */
  mimeType: string
  /** File size in bytes */
  size: number
  /** Additional metadata from the provider */
  metadata?: Record<string, unknown>
}

/**
 * Error returned by a failed OSS upload
 */
export interface OSSUploadError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'UPLOAD_FAILED' | 'AUTH_REQUIRED'
  message: string
}

/**
 * Response from an OSS upload endpoint
 */
export type OSSUploadResponse
  = { success: true, data: OSSUploadResult }
    | { success: false, error: OSSUploadError }
