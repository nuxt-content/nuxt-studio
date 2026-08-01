import { createHash } from 'node:crypto'
import { createError, eventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { requireStudioAuth } from '../../utils/auth'

interface CloudinaryResource {
  asset_id: string
  public_id: string
  secure_url: string
  resource_type: string
  format?: string
  created_at?: string
  bytes?: number
  width?: number
  height?: number
}

function getCloudinaryConfig() {
  const media = useRuntimeConfig().studio.media as { cloudinary?: { cloudName?: string, apiKey?: string, apiSecret?: string, folder?: string } }
  const config = media.cloudinary
  if (!config?.cloudName || !config.apiKey || !config.apiSecret) {
    throw createError({ statusCode: 500, message: 'Cloudinary media storage is not configured' })
  }
  return config as { cloudName: string, apiKey: string, apiSecret: string, folder?: string }
}

function signParameters(parameters: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(parameters)
    .filter(key => parameters[key] !== undefined && parameters[key] !== '')
    .sort()
    .map(key => `${key}=${parameters[key]}`)
    .join('&')
  return createHash('sha1').update(`${payload}${apiSecret}`).digest('hex')
}

function mediaPath(publicId: string, format?: string) {
  return format ? `${publicId}.${format}` : publicId
}

function toMediaItem(resource: CloudinaryResource, folder?: string) {
  const publicId = resource.public_id.startsWith(`${folder}/`) || !folder
    ? resource.public_id
    : resource.public_id.slice(`${folder}/`.length)
  const fsPath = mediaPath(publicId, resource.format)
  const parts = fsPath.split('/')
  const name = parts.at(-1) || fsPath
  const extension = resource.format || name.split('.').pop() || ''
  return {
    id: `public-assets/${fsPath}`,
    fsPath,
    extension,
    stem: name.slice(0, -(extension.length + 1)) || name,
    path: resource.secure_url,
    url: resource.secure_url,
    size: resource.bytes,
    width: resource.width,
    height: resource.height,
    resourceType: resource.resource_type,
    createdAt: resource.created_at,
  }
}

async function cloudinaryRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) {
    throw createError({ statusCode: response.status, message: data.error?.message || 'Cloudinary request failed' })
  }
  return data
}

export default eventHandler(async (event) => {
  await requireStudioAuth(event)
  const config = getCloudinaryConfig()
  const path = decodeURIComponent(event.path.replace('/__nuxt_studio/medias/', '')).replace(/^\/+/, '')
  const folder = config.folder?.replace(/^\/+|\/+$/g, '')
  const publicId = folder ? `${folder}/${path.replace(/\.[^/.]+$/, '')}` : path.replace(/\.[^/.]+$/, '')
  const apiBase = `https://api.cloudinary.com/v1_1/${config.cloudName}`

  if (event.method === 'GET') {
    const expression = folder ? `folder:${folder}/*` : undefined
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const params: Record<string, string> = { timestamp, type: 'upload' }
    if (expression) params.expression = expression
    const signature = signParameters(params, config.apiSecret)
    const body = new URLSearchParams({ ...params, api_key: config.apiKey, signature })
    const result = await cloudinaryRequest<{ resources: CloudinaryResource[] }>(`${apiBase}/resources/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (path.endsWith('/') || !path) return result.resources.map(resource => toMediaItem(resource, folder))
    const resource = result.resources.find(item => mediaPath(item.public_id, item.format) === publicId || item.public_id === publicId)
    if (!resource) throw createError({ statusCode: 404, message: 'Item not found' })
    return toMediaItem(resource, folder)
  }

  if (event.method === 'PUT') {
    const body = await readBody<{ raw?: string }>(event)
    if (!body.raw) throw createError({ statusCode: 400, message: 'Media payload is missing' })
    const [meta, data] = body.raw.split(';base64,')
    const mimeType = meta?.replace('data:', '') || 'application/octet-stream'
    const approximateSize = ((data?.length || 0) * 3) / 4
    const mediaConfig = useRuntimeConfig(event).public.studio.media
    if (approximateSize > mediaConfig.maxFileSize) throw createError({ statusCode: 413, message: 'File size exceeds maximum' })
    if (!mediaConfig.allowedTypes.some((type: string) => mimeType.startsWith(type.replace('*', '')))) throw createError({ statusCode: 415, message: `File type "${mimeType}" is not allowed` })
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const uploadParams: Record<string, string> = { timestamp }
    if (folder) uploadParams.folder = folder
    if (publicId) uploadParams.public_id = publicId
    const signature = signParameters(uploadParams, config.apiSecret)
    const uploadBody = new URLSearchParams({ ...uploadParams, api_key: config.apiKey, signature, file: body.raw })
    const resource = await cloudinaryRequest<CloudinaryResource>(`${apiBase}/auto/upload`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: uploadBody,
    })
    return toMediaItem(resource, folder)
  }

  if (event.method === 'DELETE') {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const params = { public_id: publicId, timestamp }
    const signature = signParameters(params, config.apiSecret)
    const body = new URLSearchParams({ ...params, api_key: config.apiKey, signature })
    await cloudinaryRequest(`${apiBase}/resources/destroy`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body })
    return 'OK'
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' })
})
