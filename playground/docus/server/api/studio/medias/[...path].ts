import { prefixStorage } from 'unstorage'
import { withLeadingSlash } from 'ufo'
import { requireStudioAuth } from '../../../utils/studio-auth'
import { VirtualMediaCollectionName } from 'nuxt-studio/app/utils'

export default defineEventHandler(async (event) => {
  await requireStudioAuth(event)

  const { maxFileSize, allowedTypes } = useRuntimeConfig(event).public.studio.media
  const path = event.path.replace('/api/studio/medias/', '')
  console.log('path', path)
  const key = path.replace(/\//g, ':').replace(new RegExp(`^${VirtualMediaCollectionName}:`), '')
  console.log('key', key)
  const storage = prefixStorage(useStorage('s3'), 'studio/')

  // GET => getItem / getKeys
  if (event.method === 'GET') {
    const isBaseKey = key.endsWith('/') || key.endsWith(':')

    if (isBaseKey) {
      const keys = await storage.getKeys(key)
      return keys.map((k: string) => k.replace(/:/g, '/'))
    }

    const exists = await storage.hasItem(key)
    if (!exists) {
      throw createError({ statusCode: 404, message: 'Item not found' })
    }

    // Reconstruct media item with S3 public URL (mirrors dev public route pattern)
    const publicUrl = process.env.S3_PUBLIC_URL
    const fsPath = withLeadingSlash(key.replace(/:/g, '/'))
    console.log('fsPath', fsPath)
    return {
      id: path,
      fsPath,
      extension: fsPath.split('.').pop(),
      stem: fsPath.split('.').slice(0, -1).join('.'),
      path: `${publicUrl}${fsPath}`,
    }
  }

  // PUT => setKey => upload media file
  if (event.method === 'PUT') {
    const body = await readBody(event)

    if (!body.raw) {
      throw createError({ statusCode: 400, message: 'Raw data is required' })
    }

    const raw = body.raw as string
    const [meta, data] = raw.split(';base64,')
    const mimeType = meta!.replace('data:', '')

    // Approximate binary size from base64 length
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
      bytes[i] = binaryString.charCodeAt(i)
    }

    await storage.setItemRaw(key, bytes)

    return 'OK'
  }

  // DELETE => removeItem
  if (event.method === 'DELETE') {
    await storage.removeItem(key)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
