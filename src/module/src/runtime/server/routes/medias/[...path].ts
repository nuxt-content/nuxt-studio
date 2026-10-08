import { joinURL, withLeadingSlash } from 'ufo'
import { createError, eventHandler, getRequestHeader, readBody, readRawBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../utils/constants'
import { base64ToBytes, isMediaTypeAllowed, parseDataUrl } from '../../../utils/media'
import { requireStudioAuth } from '../../utils/auth'
import { blob } from 'hub:blob'

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const { prefix, publicUrl, maxFileSize, allowedTypes } = useRuntimeConfig(event).public.studio.media

  const path = event.path.replace('/__nuxt_studio/medias/', '')
  // Unstorage HTTP driver uses ':' as key separator — convert URL slashes to colons
  // and strip the virtual collection prefix to get the raw storage key
  const key = path.replace(/\//g, ':').replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}:`), '')

  // GET => getItem / getKeys
  if (event.method === 'GET') {
    // Trailing ':' signals a getKeys (list) request from the unstorage HTTP driver
    const isBaseKey = key.endsWith('/') || key.endsWith(':')

    if (isBaseKey) {
      // Strip the trailing delimiter that signals a list request, then normalise ':' to '/'
      const subPath = key.slice(0, -1).replace(/:/g, '/')
      // Build the effective prefix for blob.list — handle empty prefix as "list all"
      const effectivePrefix = prefix
        ? (subPath ? `${prefix}/${subPath}` : prefix)
        : subPath
      const { blobs } = await blob.list(effectivePrefix ? { prefix: `${effectivePrefix}/` } : {})
      return blobs.map((b: { pathname: string }) => {
        return prefix ? b.pathname.slice(`${prefix}/`.length) : b.pathname
      })
    }

    const blobPath = key.replace(/:/g, '/')
    const pathname = prefix ? `${prefix}/${blobPath}` : blobPath
    const meta = await blob.head(pathname)
    if (!meta) {
      throw createError({ statusCode: 404, message: 'Item not found' })
    }

    const fsPath = withLeadingSlash(blobPath)
    const resolvedPath = meta.url ?? joinURL(publicUrl, prefix, fsPath)

    return {
      id: path,
      fsPath,
      extension: fsPath.split('.').pop(),
      stem: fsPath.split('.').slice(0, -1).join('.'),
      path: resolvedPath,
    }
  }

  // PUT => upload media file
  if (event.method === 'PUT') {
    const blobPath = key.replace(/:/g, '/')
    const pathname = prefix ? `${prefix}/${blobPath}` : blobPath
    const maxFileSizeMessage = `File size exceeds maximum of ${maxFileSize / 1024 / 1024}MB`

    // Raw bytes upload (current clients): the content type is the media type
    const contentType = getRequestHeader(event, 'content-type')?.split(';')[0]!.trim().toLowerCase() || ''
    if (contentType && contentType !== 'application/json') {
      // Reject before reading the body when the declared size is already too large
      const contentLength = Number(getRequestHeader(event, 'content-length'))
      if (contentLength > maxFileSize) {
        throw createError({ statusCode: 413, message: maxFileSizeMessage })
      }

      if (!isMediaTypeAllowed(contentType, allowedTypes)) {
        throw createError({ statusCode: 415, message: `File type "${contentType}" is not allowed` })
      }

      const bytes = await readRawBody(event, false)
      if (!bytes?.byteLength) {
        throw createError({ statusCode: 400, message: 'Empty file' })
      }
      if (bytes.byteLength > maxFileSize) {
        throw createError({ statusCode: 413, message: maxFileSizeMessage })
      }

      await blob.put(pathname, bytes, { contentType: contentType })
      return 'OK'
    }

    // JSON body: folder placeholders, and base64 data URLs from older cached clients
    const body = await readBody(event)
    if (!body.raw) {
      await blob.put(pathname, JSON.stringify(body), { contentType: 'application/json' })
    }
    else {
      const parsed = typeof body.raw === 'string' ? parseDataUrl(body.raw) : undefined
      if (!parsed) {
        throw createError({ statusCode: 400, message: 'Invalid data URL' })
      }

      const approximateSize = (parsed.base64.length * 3) / 4
      if (approximateSize > maxFileSize) {
        throw createError({ statusCode: 413, message: maxFileSizeMessage })
      }

      const { mimeType } = parsed
      if (!isMediaTypeAllowed(mimeType, allowedTypes)) {
        throw createError({ statusCode: 415, message: `File type "${mimeType}" is not allowed` })
      }

      const bytes = base64ToBytes(parsed.base64)
      await blob.put(pathname, bytes, { contentType: mimeType })
    }

    return 'OK'
  }

  // DELETE => del
  if (event.method === 'DELETE') {
    const blobPath = key.replace(/:/g, '/')
    const pathname = prefix ? `${prefix}/${blobPath}` : blobPath
    await blob.del(pathname)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
