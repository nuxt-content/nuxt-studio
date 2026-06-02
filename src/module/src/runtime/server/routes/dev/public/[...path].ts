import type { H3Event } from 'h3'
import { createError, eventHandler, getRequestHeader, readRawBody, setResponseHeader } from 'h3'
import type { Storage, StorageMeta } from 'unstorage'
import { withLeadingSlash } from 'ufo'
// @ts-expect-error useStorage is not defined in .nuxt/imports.d.ts
import { useStorage } from '#imports'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../../utils/constants'


export default eventHandler(async (event) => {
  const path = event.path.replace('/__nuxt_studio/dev/public/', '')
  const key = path.replace(/\//g, ':').replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}:`), '')
  const storage = useStorage('nuxt_studio_public_assets') as Storage

  // GET => getItem / getKeys
  if (event.method === 'GET') {
    const lastChar = key[key.length - 1];
    const isBaseKey = lastChar === "/" || lastChar === ":";
    if (isBaseKey) {
      const keys = await storage.getKeys(key);
      return keys.map((key) => key.replace(/:/g, "/"));
    }

    const item = await storage.getMeta(key)
    if (!item) {
      throw createError({
        statusCode: 404,
        statusMessage: 'KV value not found',
      })
    }
    return {
      id: `${VIRTUAL_MEDIA_COLLECTION_NAME}/${key.replace(/:/g, '/')}`,
      extension: key.split('.').pop(),
      stem: key.split('.').join('.'),
      path: '/' + key.replace(/:/g, '/'),
      fsPath: withLeadingSlash(key.replace(/:/g, '/')),
      version: new Date(item.mtime || new Date()).getTime(),
    }
  }

  if (event.method === 'PUT') {
    const compressImageIfNeeded = async (buffer: Buffer, key: string): Promise<Buffer> => {
      const extension = key.split('.').pop()?.toLowerCase()
      if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
        return buffer
      }

      try {
        const sharp = await import('sharp').then(m => m.default || m)
        const originalSize = buffer.byteLength

        const sharpInstance = sharp(buffer).resize(2560, 2560, {
          fit: 'inside',
          withoutEnlargement: true,
        })

        let compressed: Buffer = buffer
        if (extension === 'jpg' || extension === 'jpeg') {
          compressed = await sharpInstance
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer()
        }
        else if (extension === 'png') {
          compressed = await sharpInstance
            .png({ compressionLevel: 9, effort: 10 })
            .toBuffer()
        }
        else if (extension === 'webp') {
          compressed = await sharpInstance
            .webp({ quality: 82, effort: 6 })
            .toBuffer()
        }

        const compressedSize = compressed.byteLength
        console.info(
          `[sharp-dev] Compressed ${key.replace(/:/g, '/')}: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB`
          + ` (saved ${(((originalSize - compressedSize) / originalSize) * 100).toFixed(1)}%)`,
        )
        return compressed
      }
      catch (err) {
        console.warn('[sharp-dev] Failed to compress image, uploading original:', err)
        return buffer
      }
    }

    if (getRequestHeader(event, 'content-type') === 'application/octet-stream') {
      const value = await readRawBody(event, false) as Buffer
      const processedValue = await compressImageIfNeeded(value, key)
      await storage.setItemRaw(key, processedValue)
    }
    else if (getRequestHeader(event, 'content-type') === 'text/plain') {
      const value = await readRawBody(event, 'utf8')
      await storage.setItem(key, value!)
    }
    else {
      const value = await readRawBody(event, 'utf8')
      const json = JSON.parse(value || '{}')
      if (json.raw) {
        const data = json.raw.split(';base64,')[1]
        const buffer = Buffer.from(data!, 'base64')
        const processedBuffer = await compressImageIfNeeded(buffer, key)
        await storage.setItemRaw(key, processedBuffer)
      }
      else {
        await storage.setItemRaw(key, Buffer.alloc(0))
      }
    }

    return 'OK'
  }

  // DELETE => removeItem
  if (event.method === 'DELETE') {
    await storage.removeItem(key)
    return 'OK'
  }
})

function setMetaHeaders(event: H3Event, meta: StorageMeta) {
  if (meta.mtime) {
    setResponseHeader(
      event,
      'last-modified',
      new Date(meta.mtime).toUTCString(),
    )
  }
  if (meta.ttl) {
    setResponseHeader(event, 'x-ttl', `${meta.ttl}`)
    setResponseHeader(event, 'cache-control', `max-age=${meta.ttl}`)
  }
}
