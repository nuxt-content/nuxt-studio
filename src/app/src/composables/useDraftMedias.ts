import { ref } from 'vue'
import { joinURL, withLeadingSlash } from 'ufo'
import type { DraftItem, StudioHost, MediaItem, RawFile, OSSUploadResult, OSSUploadResponse } from '../types'
import { VirtualMediaCollectionName, generateStemFromFsPath } from '../utils/media'
import { DraftStatus } from '../types/draft'
import { isOSSMedia } from '../types/media'
import type { useGitProvider } from './useGitProvider'
import { createSharedComposable } from './createSharedComposable'
import { useDraftBase } from './useDraftBase'
import { mediaStorage as storage } from '../utils/storage'
import { getFileExtension, slugifyFileName } from '../utils/file'
import { useHooks } from './useHooks'

export interface UploadOptions {
  /** If provided, use OSS upload result instead of base64 */
  ossResult?: OSSUploadResult
  /** Force skip OSS upload even if enabled (useful for fallback) */
  skipOSS?: boolean
}

const hooks = useHooks()

export const useDraftMedias = createSharedComposable((host: StudioHost, gitProvider: ReturnType<typeof useGitProvider>) => {
  const {
    isLoading,
    list,
    current,
    get,
    create,
    remove,
    revert,
    revertAll,
    selectByFsPath,
    unselect,
    load,
    getStatus,
  } = useDraftBase('media', host, gitProvider, storage)

  // Flag to prevent concurrent loadOSSFiles calls
  const isLoadingOSS = ref(false)

  async function upload(parentFsPath: string, file: File, options?: UploadOptions) {
    let ossResult = options?.ossResult

    // If OSS is enabled and no result provided, try to upload to OSS
    const mediaConfig = host.meta.media
    if (!ossResult && !options?.skipOSS && mediaConfig?.enabled) {
      ossResult = await uploadToOSS(file, mediaConfig.endpoint, parentFsPath) || undefined
    }

    // Create draft item (with OSS URL or base64 fallback)
    const draftItem = ossResult
      ? await ossFileToDraftItem(parentFsPath, file, ossResult)
      : await fileToDraftItem(parentFsPath, file)

    host.media.upsert(draftItem.fsPath, draftItem.modified!)
    await create(draftItem.fsPath, draftItem.modified!)
  }

  /**
   * Upload a file to the configured OSS endpoint
   */
  async function uploadToOSS(file: File, endpoint: string, parentFsPath: string): Promise<OSSUploadResult | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('parentFsPath', parentFsPath)

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.warn('[Studio OSS] Upload failed with status', response.status)
        return null
      }

      const result: OSSUploadResponse = await response.json()

      if (!result.success) {
        console.warn('[Studio OSS] Upload failed:', result.error.message)
        return null
      }

      return result.data
    }
    catch (error) {
      console.warn('[Studio OSS] Upload error:', error)
      return null
    }
  }

  /**
   * Delete a file from the configured OSS endpoint
   */
  async function deleteFromOSS(key: string, endpoint: string): Promise<boolean> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })

      if (!response.ok) {
        console.warn('[Studio OSS] Delete failed with status', response.status)
        return false
      }

      const result = await response.json()

      if (!result.success) {
        console.warn('[Studio OSS] Delete failed:', result.error?.message)
        return false
      }

      console.info(`[Studio OSS] Deleted: ${key}`)
      return true
    }
    catch (error) {
      console.warn('[Studio OSS] Delete error:', error)
      return false
    }
  }

  /**
   * Remove media files, handling OSS deletion if needed
   */
  async function removeMedia(fsPaths: string[], options?: { rerender?: boolean }) {
    const mediaConfig = host.meta.media
    const { rerender = true } = options || {}
    const failedPaths: string[] = []

    for (const fsPath of fsPaths) {
      const draftItem = list.value.find(d => d.fsPath === fsPath)
      const mediaItem = draftItem?.modified as MediaItem | undefined

      // If OSS file with a delete endpoint configured, delete from R2 first
      if (mediaItem?.ossKey && mediaConfig?.deleteEndpoint) {
        const deleted = await deleteFromOSS(mediaItem.ossKey, mediaConfig.deleteEndpoint)

        if (!deleted) {
          // Skip local removal if R2 delete failed to avoid orphaned files
          console.error(`[Studio OSS] Failed to delete ${mediaItem.ossKey} from R2, skipping local removal`)
          failedPaths.push(fsPath)
          continue
        }

        // For OSS files, handle removal directly to ensure list is updated
        await storage.removeItem(fsPath)
        await host.media.delete(fsPath)
        list.value = list.value.filter(item => item.fsPath !== fsPath)
      }
      else {
        // For non-OSS files, use the base remove function
        await remove([fsPath], { rerender: false })
      }
    }

    if (rerender) {
      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.removeMedia' })
    }

    // Warn about failed deletions
    if (failedPaths.length > 0) {
      console.warn(`[Studio OSS] Failed to delete ${failedPaths.length} files from R2:`, failedPaths)
    }
  }

  async function fileToDraftItem(parentFsPath: string, file: File): Promise<DraftItem<MediaItem>> {
    const rawData = await fileToDataUrl(file)
    const slugifiedFileName = slugifyFileName(file.name)
    const fsPath = parentFsPath !== '/' ? joinURL(parentFsPath, slugifiedFileName) : slugifiedFileName

    return {
      fsPath,
      remoteFile: undefined,
      status: DraftStatus.Created,
      modified: {
        id: joinURL(VirtualMediaCollectionName, fsPath),
        fsPath,
        extension: getFileExtension(fsPath),
        stem: generateStemFromFsPath(fsPath),
        path: withLeadingSlash(fsPath),
        raw: rawData,
      },
    }
  }

  /**
   * Create a draft item from an OSS upload result (external storage)
   * Unlike fileToDraftItem, this doesn't store base64 data - it only references the OSS URL
   */
  async function ossFileToDraftItem(parentFsPath: string, file: File, ossResult: OSSUploadResult): Promise<DraftItem<MediaItem>> {
    const slugifiedFileName = slugifyFileName(file.name)
    const fsPath = parentFsPath !== '/' ? joinURL(parentFsPath, slugifiedFileName) : slugifiedFileName

    return {
      fsPath,
      remoteFile: undefined,
      status: DraftStatus.Created,
      modified: {
        id: joinURL(VirtualMediaCollectionName, fsPath),
        fsPath,
        extension: getFileExtension(fsPath),
        stem: generateStemFromFsPath(fsPath),
        path: ossResult.url, // Use OSS URL as the path
        ossUrl: ossResult.url,
        ossKey: (ossResult.metadata as { key?: string } | undefined)?.key, // Store the storage key for matching after refresh
        ossMetadata: ossResult.metadata,
        // No raw data - file is stored externally
      },
    }
  }

  async function rename(items: { fsPath: string, newFsPath: string }[]) {
    for (const item of items) {
      const { fsPath, newFsPath } = item

      const existingDraftToRename = list.value.find(draftItem => draftItem.fsPath === fsPath) as DraftItem<MediaItem>

      const currentDbItem = await host.media.get(fsPath)
      if (!currentDbItem) {
        throw new Error(`Database item not found for document fsPath: ${fsPath}`)
      }

      const mediaItem = currentDbItem as MediaItem

      // For OSS files, don't delete from R2 - just update local references
      if (isOSSMedia(mediaItem)) {
        // Remove from local storage only (not from R2)
        await storage.removeItem(fsPath)
        await host.media.delete(fsPath)
        list.value = list.value.filter(d => d.fsPath !== fsPath)
      }
      else {
        // For non-OSS files, use base remove
        await remove([fsPath], { rerender: false })
      }

      // Create new item with updated path but keep OSS references unchanged
      const newDbItem: MediaItem = {
        ...currentDbItem,
        fsPath: newFsPath,
        id: joinURL(VirtualMediaCollectionName, newFsPath),
        stem: generateStemFromFsPath(newFsPath),
        // Keep ossUrl if present, otherwise use local path
        path: mediaItem.ossUrl || withLeadingSlash(newFsPath),
      }

      await host.media.upsert(newFsPath, newDbItem)

      let originalDbItem: MediaItem | undefined = currentDbItem
      if (existingDraftToRename) {
        originalDbItem = existingDraftToRename.original
      }

      await create(newFsPath, newDbItem, originalDbItem, { rerender: false })
    }

    await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.rename' })
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  /**
   * Load OSS files from the configured list endpoint.
   * This fetches all files from R2/S3 and creates draft entries for them.
   * Should be called after load() to populate the media tree with OSS files.
   * Handles pagination to load all files even when >1000.
   */
  async function loadOSSFiles(): Promise<void> {
    // Prevent concurrent calls (e.g., from rapid refresh)
    if (isLoadingOSS.value) {
      return
    }

    const mediaConfig = host.meta.media
    if (!mediaConfig?.enabled || !mediaConfig?.listEndpoint) {
      return
    }

    isLoadingOSS.value = true
    try {
      let continuationToken: string | undefined

      do {
        // Build URL with optional continuation token
        const url = new URL(mediaConfig.listEndpoint, window.location.origin)
        if (continuationToken) {
          url.searchParams.set('continuationToken', continuationToken)
        }

        const response = await fetch(url.toString())
        if (!response.ok) {
          console.warn('[Studio OSS] Failed to list files:', response.status)
          return
        }

        const result = await response.json()
        if (!result.success || !result.data?.files) {
          console.warn('[Studio OSS] Invalid list response')
          return
        }

        for (const file of result.data.files) {
          // Reconstruct original fsPath from metadata or fall back to R2 key
          const parentFsPath = file.parentFsPath || ''
          const filename = file.key.split('/').pop() || ''
          const originalFsPath = parentFsPath
            ? joinURL(parentFsPath, filename)
            : file.key

          // Skip if already in draft list (check fsPath, originalFsPath, and ossKey for matching)
          if (list.value.some((d) => {
            const mediaItem = d.modified as MediaItem | undefined
            return d.fsPath === file.key || d.fsPath === originalFsPath || mediaItem?.ossKey === file.key
          })) {
            continue
          }

          // Create MediaItem from OSS file with original folder structure
          const mediaItem: MediaItem = {
            id: joinURL(VirtualMediaCollectionName, originalFsPath),
            fsPath: originalFsPath,
            extension: getFileExtension(originalFsPath),
            stem: generateStemFromFsPath(originalFsPath),
            path: file.url,
            ossUrl: file.url,
            ossKey: file.key,
            ossMetadata: {
              size: file.size,
              lastModified: file.lastModified,
              mimeType: file.mimeType,
            },
          }

          // Upsert to host.media so it appears in the tree
          await host.media.upsert(originalFsPath, mediaItem)

          // Create draft entry (this makes it persist in the draft list)
          await create(originalFsPath, mediaItem, mediaItem, { rerender: false })
        }

        // Check for more pages
        continuationToken = result.data.isTruncated
          ? result.data.nextContinuationToken
          : undefined
      } while (continuationToken)

      // Trigger tree rebuild once after all pages loaded
      await hooks.callHook('studio:draft:media:updated', { caller: 'useDraftMedias.loadOSSFiles' })
    }
    catch (error) {
      console.warn('[Studio OSS] Error loading files:', error)
    }
    finally {
      isLoadingOSS.value = false
    }
  }

  async function listAsRawFiles(): Promise<RawFile[]> {
    const files = [] as RawFile[]
    for (const draftItem of list.value) {
      if (draftItem.status === DraftStatus.Pristine) {
        continue
      }

      // Skip OSS-stored files - they don't need Git commit
      const mediaItem = draftItem.modified as MediaItem | undefined
      if (mediaItem && isOSSMedia(mediaItem)) {
        continue
      }

      if (draftItem.status === DraftStatus.Deleted) {
        files.push({ path: joinURL('public', draftItem.fsPath), content: null, status: draftItem.status, encoding: 'base64' })
        continue
      }

      const content = (await draftItem.modified?.raw as string).replace(/^data:\w+\/\w+;base64,/, '')
      files.push({ path: joinURL('public', draftItem.fsPath), content, status: draftItem.status, encoding: 'base64' })
    }

    return files
  }

  return {
    isLoading,
    list,
    current,
    get,
    create,
    update: () => {},
    duplicate: () => {},
    remove: removeMedia,
    revert,
    revertAll,
    rename,
    load,
    loadOSSFiles,
    selectByFsPath,
    unselect,
    upload,
    listAsRawFiles,
    getStatus,
  }
})
