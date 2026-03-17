import { createError } from 'h3'
import { createIPX, ipxFSStorage, ipxHttpStorage } from 'ipx'
import type { IPX } from 'ipx'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { useRuntimeConfig } from '#imports'

export const IPX_PREFIX = '/__nuxt_studio/ipx'
export const DAY_IN_SECONDS = 60 * 60 * 24

const mediaConfig = useRuntimeConfig().public.studio.media
export const publicDir: string = mediaConfig.publicUrl

function getCdnDomain(): string | null {
  if (!mediaConfig.external) {
    return null
  }
  try {
    return new URL(mediaConfig.publicUrl).hostname
  }
  catch {
    return null
  }
}

let cachedIpx: IPX | null = null

export function getIpx() {
  if (!cachedIpx) {
    const cdnDomain = getCdnDomain()
    cachedIpx = createIPX({
      storage: ipxFSStorage({ dir: publicDir }),
      ...(cdnDomain && {
        httpStorage: ipxHttpStorage({ domains: [cdnDomain] }),
      }),
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

export async function getOriginalImageFromFs(id: string) {
  if (/^https?:\/\//i.test(id)) {
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

  const id = decodeURIComponent(idSegments.join('/'))
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
