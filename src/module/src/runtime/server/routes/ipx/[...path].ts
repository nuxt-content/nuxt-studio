import { eventHandler, getRequestURL, setResponseHeader } from 'h3'
import { requireStudioAuth } from '../../utils/auth'
import { DAY_IN_SECONDS, IPX_PREFIX, getContentTypeFromPath, getIpx, getOriginalImage, parseIpxPath, requireAllowedDomain } from '../../utils/media/ipx'

/**
 * Serve optimized thumbnails for Studio media picker using IPX.
 * URL format: /__nuxt_studio/ipx/<modifiers>/<source-path>
 */
export default eventHandler(async (event) => {
  await requireStudioAuth(event)

  const url = getRequestURL(event)

  if (!url.pathname.startsWith(`${IPX_PREFIX}/`)) {
    return
  }

  const parsed = parseIpxPath(url.pathname)
  if (!parsed) {
    return
  }

  const domain = requireAllowedDomain(parsed.id)

  const ipx = getIpx(domain)
  const image = ipx(parsed.id, parsed.modifiers)
  let data: Buffer | string
  let format: string | undefined

  try {
    const result = await image.process()
    data = result.data
    format = result.format
  }
  catch (error) {
    console.error('[studio:ipx] process error for', parsed.id, error)
    const fallbackData = await getOriginalImage(parsed.id)
    if (!fallbackData) {
      console.error('[studio:ipx] fallback also failed for', parsed.id)
      throw error
    }

    console.log('[studio:ipx] serving original (unoptimized) for', parsed.id)
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
