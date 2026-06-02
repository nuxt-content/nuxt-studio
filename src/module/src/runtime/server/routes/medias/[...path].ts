import { joinURL, withLeadingSlash } from 'ufo'
import { createError, eventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../utils/constants'
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
    const body = await readBody(event)
    const blobPath = key.replace(/:/g, '/')
    const pathname = prefix ? `${prefix}/${blobPath}` : blobPath

    if (!body.raw) {
      await blob.put(pathname, JSON.stringify(body), { contentType: 'application/json' })
    }
    else {
      const raw = body.raw as string
      const [meta, data] = raw.split(';base64,')
      const mimeType = meta!.replace('data:', '')

      const approximateSize = (data!.length * 3) / 4
      if (approximateSize > maxFileSize) {
        throw createError({ statusCode: 413, message: `File size exceeds maximum of ${maxFileSize / 1024 / 1024}MB` })
      }

      if (!allowedTypes.some((t: string) => mimeType.startsWith(t.replace('*', '')))) {
        throw createError({ statusCode: 415, message: `File type "${mimeType}" is not allowed` })
      }

      const binaryString = atob(data!)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)!
      }

      let uploadData: Uint8Array | Buffer = bytes

      const isCompressibleImage = mimeType.startsWith('image/')
        && mimeType !== 'image/svg+xml'
        && mimeType !== 'image/gif'
      if (isCompressibleImage) {
        try {
          const sharp = await import('sharp').then(m => m.default || m)
          const originalSize = bytes.byteLength

          const sharpInstance = sharp(Buffer.from(bytes)).resize(2560, 2560, {
            fit: 'inside',
            withoutEnlargement: true,
          })

          if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            console.log('comporessing')
            uploadData = await sharpInstance
              .jpeg({ quality: 82, mozjpeg: true })
              .toBuffer()
          }
          else if (mimeType === 'image/png') {
            uploadData = await sharpInstance
              .png({ compressionLevel: 9, effort: 10 })
              .toBuffer()
          }
          else if (mimeType === 'image/webp') {
            uploadData = await sharpInstance
              .webp({ quality: 82, effort: 6 })
              .toBuffer()
          }

          const compressedSize = (uploadData as Buffer).byteLength
          console.info(
            `[sharp] Compressed ${blobPath}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB`
            + ` (saved ${(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%)`,
          )
        }
        catch (err) {
          console.warn('[sharp] Failed to compress image, uploading original:', err)
        }
      }

      await blob.put(pathname, uploadData, { contentType: mimeType })
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
