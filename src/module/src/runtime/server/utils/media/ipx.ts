import { createError } from 'h3'
import type { IPXStorage, IPXStorageMeta } from 'ipx'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { hasProtocol, parseURL } from 'ufo'
import { useRuntimeConfig } from '#imports'

export const IPX_PREFIX = '/__nuxt_studio/ipx'
export const DAY_IN_SECONDS = 60 * 60 * 24

const mediaConfig = useRuntimeConfig().public.studio.media
const studioConfig = useRuntimeConfig().public.studio
export const publicDir: string = mediaConfig.publicUrl

// ipx is an optional dependency (requires sharp which uses native binaries
// unavailable on some platforms such as Cloudflare Workers). The import is
// performed at runtime through a variable so that Rollup/Nitro does NOT
// follow it during the server bundle step.
type IpxHandler = (id: string, modifiers?: Record<string, string>) => { process: () => Promise<{ data: Buffer | string, format?: string }> }

let cachedIpx: IpxHandler | null | undefined
let cachedIpxModule: Promise<typeof import('ipx') | null> | undefined
const ipxByOrigin = new Map<string, IpxHandler>()

/**
 * Creates IPX storage backed by same-origin HTTP requests.
 *
 * This is used in production deployments where the local filesystem is not
 * accessible at runtime even though assets are still publicly served.
 *
 * @param origin - Current request origin.
 * @returns An IPX storage implementation that proxies asset reads through HTTP.
 * @example
 * createSameOriginStorage('https://example.com')
 */
function createSameOriginStorage(origin: string): IPXStorage {
  return {
    name: 'same-origin',
    async getMeta(id: string): Promise<IPXStorageMeta | undefined> {
      const url = `${origin}/${id.replace(/^\/+/, '')}`
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) return undefined
      const lastModified = response.headers.get('last-modified')
      return {
        mtime: lastModified ? new Date(lastModified) : undefined,
        maxAge: DAY_IN_SECONDS,
      }
    },
    async getData(id: string): Promise<ArrayBuffer | undefined> {
      const url = `${origin}/${id.replace(/^\/+/, '')}`
      const response = await fetch(url)
      if (!response.ok) return undefined
      return response.arrayBuffer()
    },
  }
}

/**
 * Loads the optional `ipx` dependency lazily at runtime.
 *
 * @returns The `ipx` module when available, otherwise `null`.
 */
async function loadIpxModule() {
  if (!cachedIpxModule) {
    cachedIpxModule = (async () => {
      try {
        const ipxModuleId = 'ipx'
        return await import(/* @vite-ignore */ ipxModuleId)
      }
      catch {
        return null
      }
    })()
  }

  return cachedIpxModule
}

export function requireAllowedDomain(id: string): string | undefined {
  if (!mediaConfig.external) return undefined
  const configuredDomain = parseURL(mediaConfig.publicUrl).host
  const requestDomain = parseURL(id).host
  if (configuredDomain && requestDomain !== configuredDomain) {
    throw createError({ statusCode: 403, statusMessage: 'IPX_FORBIDDEN_DOMAIN' })
  }
  return requestDomain || configuredDomain || undefined
}

/**
 * Returns an IPX instance for processing images.
 *
 * - External media: uses HTTP storage restricted to the configured CDN domain.
 * - Production (non-dev, non-external): uses HTTP storage fetching from the same
 *   server origin, which avoids filesystem path issues on serverless platforms
 *   (e.g. Vercel) where the build-time publicDir no longer exists at runtime.
 * - Dev mode: uses local filesystem storage for instant local edits.
 *
 * @param domain - Allowed CDN domain for external media mode.
 * @param originUrl - Current request origin (e.g. `https://mysite.com`). When
 *   provided in non-external mode, enables the same-origin HTTP storage path.
 * @returns An IPX handler when the optional dependency is available, otherwise `null`.
 * @example
 * await getIpx('cdn.example.com', 'https://example.com')
 */
export async function getIpx(domain?: string, originUrl?: string): Promise<IpxHandler | null> {
  const ipxModule = await loadIpxModule()
  if (!ipxModule) {
    cachedIpx = null
    return null
  }

  const { createIPX, ipxFSStorage, ipxHttpStorage } = ipxModule

  if (mediaConfig.external) {
    if (cachedIpx === undefined) {
      cachedIpx = createIPX({
        storage: {} as IPXStorage,
        httpStorage: ipxHttpStorage({ domains: domain ? [domain] : [] }),
        maxAge: DAY_IN_SECONDS,
      })
    }
    return cachedIpx
  }

  if (originUrl && !studioConfig.dev) {
    const cached = ipxByOrigin.get(originUrl)
    if (cached) return cached

    const ipx = createIPX({
      storage: createSameOriginStorage(originUrl),
      maxAge: DAY_IN_SECONDS,
    })
    ipxByOrigin.set(originUrl, ipx)
    return ipx
  }

  if (!cachedIpx) {
    cachedIpx = createIPX({
      storage: ipxFSStorage({ dir: publicDir }),
      maxAge: DAY_IN_SECONDS,
    })
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

export async function getOriginalImage(id: string, originUrl?: string): Promise<Buffer | null> {
  if (hasProtocol(id)) return getOriginalExternalImage(id)
  if (originUrl && !studioConfig.dev) return getOriginalHttpImage(id, originUrl)
  return getOriginalFsImage(id)
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

/**
 * Fetches a public asset by constructing an HTTP URL from the server origin.
 * Used as a fallback in production when the local filesystem path is unavailable
 * (e.g. serverless deployments where the build-time publicDir no longer exists).
 *
 * @param id - Relative file path (e.g. `images/photo.jpg`)
 * @param originUrl - Current request origin (e.g. `https://mysite.com`)
 * @returns The original file contents when found, otherwise `null`.
 * @example
 * await getOriginalHttpImage('images/photo.jpg', 'https://example.com')
 */
export async function getOriginalHttpImage(id: string, originUrl: string): Promise<Buffer | null> {
  try {
    const url = `${originUrl}/${id.replace(/^\/+/, '')}`
    const response = await fetch(url)
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
