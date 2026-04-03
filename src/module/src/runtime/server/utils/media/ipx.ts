import { createError } from 'h3'
import { createIPX, ipxHttpStorage } from 'ipx'
import type { IPX, IPXStorage } from 'ipx'
import { extname } from 'node:path'
import { hasProtocol, parseURL, withLeadingSlash } from 'ufo'
import { useRuntimeConfig } from '#imports'

export const IPX_PREFIX = '/__nuxt_studio/ipx'
export const DAY_IN_SECONDS = 60 * 60 * 24

const mediaConfig = useRuntimeConfig().public.studio.media
const cachedIpx = new Map<string, IPX>()

function getConfiguredMediaDomain(): string | undefined {
  return mediaConfig.external ? parseURL(mediaConfig.publicUrl).host : undefined
}

export function resolveIpxSource(id: string, requestUrl: URL) {
  if (!hasProtocol(id)) {
    const normalizedId = withLeadingSlash(id)
    return {
      sourceId: new URL(normalizedId, requestUrl.origin).toString(),
      domain: requestUrl.host,
    }
  }

  const configuredDomain = getConfiguredMediaDomain()
  const requestDomain = parseURL(id).host
  if (configuredDomain && requestDomain !== configuredDomain) {
    throw createError({ statusCode: 403, statusMessage: 'IPX_FORBIDDEN_DOMAIN' })
  }

  const resolvedDomain = requestDomain || configuredDomain
  if (!resolvedDomain) {
    throw createError({ statusCode: 403, statusMessage: 'IPX_FORBIDDEN_DOMAIN' })
  }

  return {
    sourceId: id,
    domain: resolvedDomain,
  }
}

export function getIpx(domain: string) {
  const cachedInstance = cachedIpx.get(domain)
  if (cachedInstance) {
    return cachedInstance
  }

  const ipx = createIPX({
    storage: {} as IPXStorage,
    httpStorage: ipxHttpStorage({ domains: [domain] }),
    maxAge: DAY_IN_SECONDS,
  })

  cachedIpx.set(domain, ipx)

  return ipx
}

export function getContentTypeFromPath(path: string) {
  const extension = extname(path).toLowerCase()

  if (extension === '.ico') return 'image/x-icon'
  if (extension === '.svg') return 'image/svg+xml'
  if (extension === '.png') return 'image/png'
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.gif') return 'image/gif'
  if (extension === '.avif') return 'image/avif'

  return null
}

export async function getOriginalImage(id: string): Promise<Buffer | null> {
  return hasProtocol(id) ? getOriginalExternalImage(id) : null
}

export async function getOriginalExternalImage(id: string): Promise<Buffer | null> {
  try {
    const response = await fetch(id)
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  }
  catch {
    return null
  }
}

export function parseIpxPath(pathname: string) {
  const relativePath = pathname.slice(IPX_PREFIX.length).replace(/^\/+/, '')
  if (!relativePath) {
    return null
  }

  const [modifiersString, ...idSegments] = relativePath.split('/')
  if (!modifiersString) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IPX_MISSING_MODIFIERS',
      message: 'IPX modifiers are required.',
    })
  }

  // Restore protocol double-slash collapsed by proxies
  // `https://` → `https:/` in URL path segments before reaching the server.
  const id = decodeURIComponent(idSegments.join('/')).replace(/^(https?:\/)([^/])/, '$1/$2')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'IPX_MISSING_ID',
      message: 'IPX resource id is required.',
    })
  }

  const modifiers: Record<string, string> = {}
  if (modifiersString !== '_') {
    for (const rawModifier of modifiersString.split(/[&,]/g)) {
      const [key, ...values] = rawModifier.split(/[:=_]/)
      if (!key) {
        continue
      }
      modifiers[key] = values.map(value => decodeURIComponent(value)).join('_')
    }
  }

  return { id, modifiers }
}
