import { createError } from 'h3'
import { createIPX, ipxFSStorage, ipxHttpStorage } from 'ipx'
import type { IPX, IPXStorage } from 'ipx'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { hasProtocol, parseURL } from 'ufo'
import { useRuntimeConfig } from '#imports'

export const IPX_PREFIX = '/__nuxt_studio/ipx'
export const DAY_IN_SECONDS = 60 * 60 * 24

const mediaConfig = useRuntimeConfig().public.studio.media
export const publicDir: string = mediaConfig.publicUrl

let cachedIpx: IPX | null = null

export function requireAllowedDomain(id: string): string | undefined {
  if (!mediaConfig.external) return undefined
  const configuredDomain = parseURL(mediaConfig.publicUrl).host
  const requestDomain = parseURL(id).host
  if (configuredDomain && requestDomain !== configuredDomain) {
    throw createError({ statusCode: 403, statusMessage: 'IPX_FORBIDDEN_DOMAIN' })
  }
  return requestDomain || configuredDomain || undefined
}

export function getIpx(domain?: string) {
  if (!cachedIpx) {
    if (mediaConfig.external) {
      cachedIpx = createIPX({
        storage: {} as IPXStorage,
        httpStorage: ipxHttpStorage({ domains: domain ? [domain] : [] }),
        maxAge: DAY_IN_SECONDS,
      })
    }
    else {
      cachedIpx = createIPX({
        storage: ipxFSStorage({ dir: publicDir }),
        maxAge: DAY_IN_SECONDS,
      })
    }
  }

  return cachedIpx
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
  return hasProtocol(id) ? getOriginalExternalImage(id) : getOriginalFsImage(id)
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

export async function getOriginalFsImage(id: string) {
  if (hasProtocol(id)) {
    return null
  }

  const normalizedId = id.replace(/^\/+/, '')
  if (!normalizedId) {
    return null
  }

  const absolutePath = resolve(publicDir, normalizedId)
  if (!absolutePath.startsWith(`${publicDir}/`) && absolutePath !== publicDir) {
    return null
  }

  try {
    return await readFile(absolutePath)
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
