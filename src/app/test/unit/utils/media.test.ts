import { describe, expect, it } from 'vitest'
import { getMediaFetchUrl, getMediaFullUrl, getMediaThumbnailUrl } from '../../../src/utils/media'

describe('media IPX URLs', () => {
  it('uses Studio IPX for local thumbnails', () => {
    expect(getMediaThumbnailUrl('/cms/illustrations/glass-illustration-2.svg')).toBe('/__nuxt_studio/ipx/s_200x200,fit_cover/cms/illustrations/glass-illustration-2.svg')
  })

  it('uses Studio IPX for local full-size images', () => {
    expect(getMediaFullUrl('/cms/illustrations/glass-illustration-2.svg')).toBe('/__nuxt_studio/ipx/_/cms/illustrations/glass-illustration-2.svg')
  })

  it('keeps Studio IPX for external thumbnails', () => {
    expect(getMediaThumbnailUrl('https://cdn.example.com/cms/illustrations/glass-illustration-2.svg')).toBe('/__nuxt_studio/ipx/s_200x200,fit_cover/https://cdn.example.com/cms/illustrations/glass-illustration-2.svg')
  })

  it('keeps Studio IPX for external full-size images', () => {
    expect(getMediaFullUrl('https://cdn.example.com/cms/illustrations/glass-illustration-2.svg')).toBe('/__nuxt_studio/ipx/_/https://cdn.example.com/cms/illustrations/glass-illustration-2.svg')
  })

  it('uses the image IPX URL for local metadata fetches', () => {
    expect(getMediaFetchUrl('/cms/illustrations/glass-illustration-2.svg', true)).toBe('/__nuxt_studio/ipx/_/cms/illustrations/glass-illustration-2.svg')
  })

  it('keeps raw local paths for non-image fetches', () => {
    expect(getMediaFetchUrl('/videos/demo.mp4', false)).toBe('/videos/demo.mp4')
  })
})
