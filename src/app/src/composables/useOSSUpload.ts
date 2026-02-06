import { ref } from 'vue'
import type { OSSUploadResult, OSSUploadResponse } from '../types'

export interface OSSUploadConfig {
  /** Whether OSS uploads are enabled */
  enabled: boolean
  /** Upload endpoint URL */
  endpoint: string
  /** Maximum file size in bytes */
  maxFileSize: number
  /** Allowed MIME types (supports wildcards like 'image/*') */
  allowedTypes: string[]
}

/**
 * Composable for uploading files to an external OSS (Object Storage Service) provider
 */
export function useOSSUpload(config: OSSUploadConfig) {
  const isUploading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Check if a file type is allowed based on the allowedTypes configuration
   */
  function isTypeAllowed(mimeType: string): boolean {
    return config.allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const prefix = type.replace('/*', '/')
        return mimeType.startsWith(prefix)
      }
      return mimeType === type
    })
  }

  /**
   * Upload a single file to the configured OSS endpoint
   */
  async function upload(file: File): Promise<OSSUploadResult | null> {
    if (!config.enabled) {
      error.value = 'OSS uploads are not enabled'
      return null
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      const maxMB = Math.round(config.maxFileSize / 1024 / 1024)
      error.value = `File size exceeds maximum of ${maxMB}MB`
      return null
    }

    // Validate file type
    if (!isTypeAllowed(file.type)) {
      error.value = `File type "${file.type}" is not allowed`
      return null
    }

    isUploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        error.value = `Upload failed with status ${response.status}`
        return null
      }

      const result: OSSUploadResponse = await response.json()

      if (!result.success) {
        error.value = result.error.message
        return null
      }

      return result.data
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Upload failed'
      return null
    }
    finally {
      isUploading.value = false
    }
  }

  /**
   * Upload multiple files to the configured OSS endpoint
   */
  async function uploadMultiple(files: File[]): Promise<(OSSUploadResult | null)[]> {
    return Promise.all(files.map(file => upload(file)))
  }

  return {
    upload,
    uploadMultiple,
    isUploading,
    error,
    isTypeAllowed,
  }
}
