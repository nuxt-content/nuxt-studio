import { createError, eventHandler, getRequestURL, setResponseHeader } from 'h3'
import { requireStudioAuth } from '../../utils/auth'
import { DAY_IN_SECONDS, IPX_PREFIX, getContentTypeFromPath, getIpx, getOriginalImage, parseIpxPath, requireAllowedDomain } from '../../utils/media/ipx'

/**
 * Serve optimized thumbnails for Studio media picker using IPX.
 * Falls back to serving original (unoptimized) images when IPX is unavailable
 * (e.g. on platforms like Cloudflare Workers where sharp is not supported).
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

  const ipx = await getIpx(domain)

  let data: Buffer | string
  let format: string | undefined

  if (ipx) {
    const image = ipx(parsed.id, parsed.modifiers)
    try {
      const result = await image.process()
      data = result.data
      format = result.format
    }
    catch (error) {
      const fallbackData = await getOriginalImage(parsed.id)
      if (!fallbackData) {
        throw error
      }

      data = fallbackData
    }
  }
  else {
    // IPX unavailable — serve original image without optimization
    const fallbackData = await getOriginalImage(parsed.id)
    if (!fallbackData) {
      throw createError({ message: 'Image not found', statusCode: 404 })
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
