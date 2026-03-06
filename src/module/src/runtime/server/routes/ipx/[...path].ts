import type { H3Event } from 'h3'
import { createError, eventHandler, getRequestURL, setResponseHeader } from 'h3'
import { createIPX, ipxFSStorage, ipxHttpStorage } from 'ipx'
import type { IPX } from 'ipx'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { useRuntimeConfig } from '#imports'

const IPX_PREFIX = '/__nuxt_studio/ipx'
const DAY_IN_SECONDS = 60 * 60 * 24

type StudioRuntimeConfig = {
  studio?: {
    ipx?: {
      publicDir?: string
    }
    repository?: {
      rootDir?: string
    }
  }
}

let cachedStorageDirsKey: string | null = null
let cachedIpx: IPX | null = null
let cachedStorageDirs: string[] = []

function getStorageDirs(event: H3Event) {
  const config = useRuntimeConfig(event) as StudioRuntimeConfig
  const configuredPublicDir = config.studio?.ipx?.publicDir
  const repositoryRootDir = config.studio?.repository?.rootDir

  return [
    configuredPublicDir,
    repositoryRootDir ? resolve(process.cwd(), repositoryRootDir, 'public') : undefined,
    resolve(process.cwd(), 'public'),
  ].filter((value): value is string => Boolean(value))
}

function getIpx(event: H3Event) {
  const storageDirs = getStorageDirs(event)

  const storageDirsKey = storageDirs.join('|')

  if (!cachedIpx || cachedStorageDirsKey !== storageDirsKey) {
    cachedIpx = createIPX({
      storage: ipxFSStorage({ dir: storageDirs }),
      httpStorage: ipxHttpStorage({
        allowAllDomains: true,
        fetchOptions: { cache: 'force-cache' },
      }),
      maxAge: DAY_IN_SECONDS,
    })

    cachedStorageDirsKey = storageDirsKey
    cachedStorageDirs = storageDirs
  }

  return cachedIpx
}

function isUnsupportedInputImageError(error: unknown) {
  return error instanceof Error && /unsupported image format/i.test(error.message)
}

function getContentTypeFromPath(path: string) {
  const extension = extname(path).toLowerCase()

  if (extension === '.ico') {
    return 'image/x-icon'
  }
  if (extension === '.svg') {
    return 'image/svg+xml'
  }
  if (extension === '.png') {
    return 'image/png'
  }
  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg'
  }
  if (extension === '.webp') {
    return 'image/webp'
  }
  if (extension === '.gif') {
    return 'image/gif'
  }
  if (extension === '.avif') {
    return 'image/avif'
  }

  return null
}

async function getOriginalImageFromFs(id: string) {
  if (/^https?:\/\//i.test(id)) {
    return null
  }

  const normalizedId = id.replace(/^\/+/, '')
  if (!normalizedId) {
    return null
  }

  for (const dir of cachedStorageDirs) {
    const absoluteDir = resolve(dir)
    const absolutePath = resolve(absoluteDir, normalizedId)

    if (!absolutePath.startsWith(`${absoluteDir}/`) && absolutePath !== absoluteDir) {
      continue
    }

    try {
      return await readFile(absolutePath)
    }
    catch {
      // Try next storage directory.
    }
  }

  return null
}

function parseIpxPath(pathname: string) {
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

  return {
    id,
    modifiers,
  }
}

/**
 * Serve optimized thumbnails for Studio media picker using IPX.
 * URL format: /__nuxt_studio/ipx/<modifiers>/<source-path>
 */
export default eventHandler(async (event) => {
  const url = getRequestURL(event)

  if (!url.pathname.startsWith(`${IPX_PREFIX}/`)) {
    return
  }

  const parsed = parseIpxPath(url.pathname)
  if (!parsed) {
    return
  }

  const ipx = getIpx(event)
  const image = ipx(parsed.id, parsed.modifiers)
  let data: Buffer | string
  let format: string | undefined

  try {
    const result = await image.process()
    data = result.data
    format = result.format
  }
  catch (error) {
    if (!isUnsupportedInputImageError(error)) {
      throw error
    }

    const fallbackData = await getOriginalImageFromFs(parsed.id)
    if (!fallbackData) {
      throw error
    }

    data = fallbackData
  }

  if (format) {
    setResponseHeader(event, 'content-type', `image/${format}`)
  }
  else {
    const contentType = getContentTypeFromPath(parsed.id)
    if (contentType) {
      setResponseHeader(event, 'content-type', contentType)
    }
  }

  setResponseHeader(event, 'cache-control', `public, max-age=${DAY_IN_SECONDS}, s-maxage=${DAY_IN_SECONDS}`)

  return data
})
