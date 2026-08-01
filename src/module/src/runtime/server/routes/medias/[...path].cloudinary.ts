import { createHash } from 'node:crypto'
import { createError, eventHandler, readBody } from 'h3'
import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { requireStudioAuth } from '../../utils/auth'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../../utils/constants'

interface CloudinaryResource {
  public_id: string
  secure_url: string
  resource_type: string
  format?: string
  created_at?: string
  bytes?: number
  width?: number
  height?: number
}

type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder?: string
}

function getCloudinaryConfig(event: H3Event): CloudinaryConfig {
  const runtime = useRuntimeConfig(event)
  const config = (runtime.studio?.media as { cloudinary?: Partial<CloudinaryConfig> } | undefined)?.cloudinary
  if (!config?.cloudName || !config.apiKey || !config.apiSecret) {
    throw createError({ statusCode: 500, message: 'Cloudinary media storage is not configured. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' })
  }
  return config as CloudinaryConfig
}

function signParameters(parameters: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(parameters)
    .filter(key => parameters[key] !== undefined && parameters[key] !== '')
    .sort()
    .map(key => `${key}=${parameters[key]}`)
    .join('&')
  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex')
}

function getFolder(config: CloudinaryConfig): string | undefined {
  return config.folder?.replace(/^\/+|\/+$/g, '') || undefined
}

function getResourceType(path: string): 'image' | 'video' | 'raw' {
  if (/\.(?:mp4|webm|mov|avi)$/i.test(path)) return 'video'
  if (/\.(?:png|jpe?g|webp|gif|avif|svg|bmp|ico|tiff?)$/i.test(path)) return 'image'
  return 'raw'
}

function getRelativePath(publicId: string, format: string | undefined, folder?: string): string {
  const relativeId = folder && publicId.startsWith(`${folder}/`)
    ? publicId.slice(folder.length + 1)
    : publicId
  return format ? `${relativeId}.${format}` : relativeId
}

function toMediaItem(resource: CloudinaryResource, folder?: string) {
  const fsPath = getRelativePath(resource.public_id, resource.format, folder)
  const name = fsPath.split('/').pop() || fsPath
  const extension = resource.format || name.split('.').pop() || ''
  return {
    id: `${VIRTUAL_MEDIA_COLLECTION_NAME}/${fsPath}`,
    fsPath,
    extension,
    stem: extension ? name.slice(0, -(extension.length + 1)) : name,
    path: resource.secure_url,
    url: resource.secure_url,
    size: resource.bytes,
    width: resource.width,
    height: resource.height,
    resourceType: resource.resource_type,
    createdAt: resource.created_at,
  }
}

function basicAuth(config: CloudinaryConfig): Record<string, string> {
  return { Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}` }
}

async function cloudinaryRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: data.error?.message || `Cloudinary request failed (${response.status})` })
  }
  return data
}

const RESOURCE_TYPES = ['image', 'video', 'raw'] as const

async function listResources(config: CloudinaryConfig, apiBase: string, prefix?: string): Promise<CloudinaryResource[]> {
  const params = new URLSearchParams({ type: 'upload', max_results: '500' })
  if (prefix) params.set('prefix', prefix)

  const results = await Promise.all(RESOURCE_TYPES.map(resourceType =>
    cloudinaryRequest<{ resources: CloudinaryResource[] }>(`${apiBase}/resources/${resourceType}?${params}`, {
      method: 'GET',
      headers: basicAuth(config),
    }).catch(() => ({ resources: [] })),
  ))

  return results.flatMap(result => result.resources)
}

/** Finds a resource by its relative Studio path across all resource types. */
async function findResourceByPath(config: CloudinaryConfig, apiBase: string, path: string, folder?: string): Promise<CloudinaryResource | undefined> {
  const prefix = folder ? (path ? `${folder}/${path.replace(/\.[^/.]+$/, '')}` : folder) : path.replace(/\.[^/.]+$/, '')
  const resources = await listResources(config, apiBase, prefix)
  return resources.find(resource => getRelativePath(resource.public_id, resource.format, folder) === path)
}

async function destroyResource(config: CloudinaryConfig, apiBase: string, publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<string | undefined> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  // Cloudinary destroy endpoint: POST /v1_1/<cloud>/<resource_type>/destroy
  // invalidate=true also purges the Cloudinary CDN cache so deleted assets stop
  // being served immediately (the CDN may otherwise keep serving the file until
  // its cache TTL expires).
  const params = { public_id: publicId, timestamp, invalidate: 'true' }
  const signature = signParameters(params, config.apiSecret)
  const result = await cloudinaryRequest<{ result?: string, error?: { message?: string } }>(`${apiBase}/${resourceType}/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...params, api_key: config.apiKey, signature }),
  })
  return result.result
}

export default eventHandler(async (event) => {
  await requireStudioAuth(event)
  const config = getCloudinaryConfig(event)
  const folder = getFolder(config)
  const apiBase = `https://api.cloudinary.com/v1_1/${config.cloudName}`

  const requestPath = decodeURIComponent(event.path.replace('/__nuxt_studio/medias/', ''))
  // The unstorage HTTP driver signals a list request with a trailing ':' (root)
  // or '/:' (subfolder). Empty path is also a root list request.
  const isListRequest = !requestPath || requestPath.endsWith(':') || requestPath.endsWith('/:')
  const path = requestPath
    .replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}/?`), '')
    .replace(/[/:]+$/, '')
    .replace(/^\/+|\/+$/g, '')

  if (event.method === 'GET') {
    if (isListRequest) {
      const prefix = folder ? (path ? `${folder}/${path}` : folder) : path || undefined
      const resources = await listResources(config, apiBase, prefix)
      return resources.map(resource => getRelativePath(resource.public_id, resource.format, folder))
    }

    // Direct resource fetch, falling back to a listing match so renamed or
    // auto-public_id resources are still resolvable.
    const withoutExtension = path.replace(/\.[^/.]+$/, '')
    const publicId = folder ? `${folder}/${withoutExtension}` : withoutExtension
    const resourceType = getResourceType(path) === 'raw' ? 'image' : getResourceType(path)
    try {
      const resource = await cloudinaryRequest<CloudinaryResource>(`${apiBase}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: basicAuth(config),
      })
      return toMediaItem(resource, folder)
    }
    catch {
      const found = await findResourceByPath(config, apiBase, path, folder)
      if (!found) throw createError({ statusCode: 404, message: 'Item not found' })
      return toMediaItem(found, folder)
    }
  }

  if (event.method === 'PUT') {
    const payload = await readBody<{ raw?: string } | string>(event)
    const raw = typeof payload === 'string' ? payload : payload?.raw

    if (path.endsWith('.gitkeep')) return 'OK'
    if (!raw) throw createError({ statusCode: 400, message: 'Media payload is missing' })

    const [meta, encoded] = raw.split(';base64,')
    if (!encoded) throw createError({ statusCode: 400, message: 'Media payload must be a base64 data URL' })
    const mimeType = meta?.replace(/^data:/, '') || 'application/octet-stream'
    const mediaConfig = useRuntimeConfig(event).public.studio.media
    const approximateSize = (encoded.length * 3) / 4
    if (approximateSize > mediaConfig.maxFileSize) throw createError({ statusCode: 413, message: 'File size exceeds maximum' })
    if (!mediaConfig.allowedTypes.some((type: string) => mimeType.startsWith(type.replace('*', '')))) throw createError({ statusCode: 415, message: `File type "${mimeType}" is not allowed` })

    const timestamp = Math.floor(Date.now() / 1000).toString()
    const uploadParams: Record<string, string> = { timestamp }
    // Deterministic public_id (relative path without extension) so GET/DELETE can
    // compute the same Cloudinary public_id later.
    uploadParams.public_id = path.replace(/\.[^/.]+$/, '')
    if (folder) uploadParams.folder = folder
    const signature = signParameters(uploadParams, config.apiSecret)
    const resource = await cloudinaryRequest<CloudinaryResource>(`${apiBase}/auto/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...uploadParams, api_key: config.apiKey, signature, file: raw }),
    })
    return toMediaItem(resource, folder)
  }

  if (event.method === 'DELETE') {
    const withoutExtension = path.replace(/\.[^/.]+$/, '')
    const computedPublicId = folder ? `${folder}/${withoutExtension}` : withoutExtension
    const resourceType = getResourceType(path)

    // Fully idempotent DELETE: never surface a 404 to the unstorage driver.
    // Try the deterministic public_id first; if that fails (e.g. older assets
    // with an auto-generated public_id), locate the resource by relative path
    // and destroy the actual public_id.
    try {
      const result = await destroyResource(config, apiBase, computedPublicId, resourceType).catch(() => undefined)
      if (result !== 'ok' && result !== 'deleted' && result !== 'not_found') {
        const found = await findResourceByPath(config, apiBase, path, folder)
        if (found) {
          await destroyResource(config, apiBase, found.public_id, (found.resource_type || resourceType) as 'image' | 'video' | 'raw').catch(() => undefined)
        }
      }
    }
    catch {
      // Swallow any provider error — the item is removed from Studio's list anyway.
    }

    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
