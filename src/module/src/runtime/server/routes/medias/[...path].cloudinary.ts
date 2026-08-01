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

function authHeaders(config: CloudinaryConfig): Record<string, string> {
  return {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
  }
}

async function cloudinaryRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: data.error?.message || `Cloudinary request failed (${response.status})` })
  }
  return data
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
  // Normalize: strip the virtual media collection prefix, trailing delimiters and slashes.
  const path = requestPath
    .replace(new RegExp(`^${VIRTUAL_MEDIA_COLLECTION_NAME}/?`), '')
    .replace(/[/:]+$/, '')
    .replace(/^\/+|\/+$/g, '')

  if (event.method === 'GET') {
    // List: return storage keys (relative fsPaths) — the unstorage HTTP driver
    // expects an array of strings, then Studio fetches each item individually.
    if (isListRequest) {
      const folderQuery = folder ? (path ? `${folder}/${path}` : folder) : path || undefined
      const expression = folderQuery
        ? `folder:${folderQuery}`
        : 'resource_type:image OR resource_type:video OR resource_type:raw'
      const result = await cloudinaryRequest<{ resources: CloudinaryResource[] }>(`${apiBase}/resources/search`, {
        method: 'POST',
        headers: authHeaders(config),
        body: new URLSearchParams({ expression, max_results: '500' }),
      })
      return result.resources.map(resource => getRelativePath(resource.public_id, resource.format, folder))
    }

    // Single item: return full media metadata.
    const withoutExtension = path.replace(/\.[^/.]+$/, '')
    const publicId = folder ? `${folder}/${withoutExtension}` : withoutExtension
    const resourceType = /\.(?:mp4|webm|mov|avi)$/i.test(path) ? 'video' : 'image'
    const resource = await cloudinaryRequest<CloudinaryResource>(`${apiBase}/resources/${resourceType}/upload/${encodeURIComponent(publicId)}`, {
      method: 'GET',
      headers: { Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}` },
    })
    return toMediaItem(resource, folder)
  }

  if (event.method === 'PUT') {
    const payload = await readBody<{ raw?: string } | string>(event)
    const raw = typeof payload === 'string' ? payload : payload?.raw

    // .gitkeep files only mark folders in the local filesystem workflow. Cloudinary
    // folders are virtual, so skip uploading them entirely.
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
    const publicId = folder ? `${folder}/${withoutExtension}` : withoutExtension
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const params = { public_id: publicId, timestamp }
    const signature = signParameters(params, config.apiSecret)
    await cloudinaryRequest(`${apiBase}/resources/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...params, api_key: config.apiKey, signature }),
    })
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
