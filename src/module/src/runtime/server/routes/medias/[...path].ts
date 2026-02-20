import { prefixStorage } from 'unstorage'
import { joinURL, withLeadingSlash } from 'ufo'
import { createError, eventHandler, readBody } from 'h3'
// @ts-expect-error useStorage is not defined in .nuxt/imports.d.ts
import { useRuntimeConfig, useStorage } from '#imports'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../utils/constants'
import { requireStudioAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const { prefix } = useRuntimeConfig(event).public.studio.media
  const storage = prefixStorage(useStorage('s3'), `${prefix}/`)

  const path = event.path.replace('/__nuxt_studio/medias/', '')
  const key = path.replace(/\//g, ':').replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}:`), '')

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

    const publicUrl = process.env.S3_PUBLIC_URL!
    const fsPath = withLeadingSlash(key.replace(/:/g, '/'))
    return {
      id: path,
      fsPath,
      extension: fsPath.split('.').pop(),
      stem: fsPath.split('.').slice(0, -1).join('.'),
      path: joinURL(publicUrl, prefix, fsPath),
    }
  }

  // PUT => upload media file
  if (event.method === 'PUT') {
    const body = await readBody(event)

    if (!body.raw) {
      await storage.setItem(key, body)
    }
    else {
      const { maxFileSize, allowedTypes } = useRuntimeConfig(event).public.studio.media

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

      await storage.setItemRaw(key, bytes)
    }

    return 'OK'
  }

  // DELETE => removeItem
  if (event.method === 'DELETE') {
    await storage.removeItem(key)
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
