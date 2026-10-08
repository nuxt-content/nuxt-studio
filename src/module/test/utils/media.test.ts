import { describe, it, expect } from 'vitest'
import { dataUrlToBlob, isMediaTypeAllowed, mediaItemFieldsFromKey, parseDataUrl } from '../../src/runtime/utils/media'

describe('mediaItemFieldsFromKey', () => {
  it('should derive fields from a root-level key', () => {
    expect(mediaItemFieldsFromKey('demo.mp4')).toEqual({
      id: 'public-assets/demo.mp4',
      extension: 'mp4',
      stem: '/demo',
      path: '/demo.mp4',
      fsPath: '/demo.mp4',
    })
  })

  it('should derive fields from a nested, colon-separated key', () => {
    expect(mediaItemFieldsFromKey('videos:sub:demo.mp4')).toEqual({
      id: 'public-assets/videos/sub/demo.mp4',
      extension: 'mp4',
      stem: '/videos/sub/demo',
      path: '/videos/sub/demo.mp4',
      fsPath: '/videos/sub/demo.mp4',
    })
  })

  it('should not duplicate the extension in stem for a file with a single dot', () => {
    const { stem, extension } = mediaItemFieldsFromKey('photo.png')

    expect(`${stem}.${extension}`).toBe('/photo.png')
  })
})

describe('dataUrlToBlob', () => {
  it('should decode a base64 data URL into a typed blob', async () => {
    const blob = dataUrlToBlob('data:video/mp4;base64,AAECAw==')

    expect(blob?.type).toBe('video/mp4')
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 3]))
  })

  it('should ignore extra data URL parameters', () => {
    expect(dataUrlToBlob('data:text/plain;charset=utf-8;base64,aGk=')?.type).toBe('text/plain')
  })

  it('should fall back to application/octet-stream when the type is missing', () => {
    expect(dataUrlToBlob('data:;base64,aGk=')?.type).toBe('application/octet-stream')
  })

  it('should return undefined for a string that is not a base64 data URL', () => {
    expect(dataUrlToBlob('https://example.com/demo.mp4')).toBeUndefined()
    expect(dataUrlToBlob('data:text/plain,hello')).toBeUndefined()
  })
})

describe('isMediaTypeAllowed', () => {
  it('should match a wildcard type', () => {
    expect(isMediaTypeAllowed('video/mp4', ['image/*', 'video/*'])).toBe(true)
  })

  it('should match an exact type', () => {
    expect(isMediaTypeAllowed('application/pdf', ['application/pdf'])).toBe(true)
  })

  it('should reject a type that is not listed', () => {
    expect(isMediaTypeAllowed('application/pdf', ['image/*', 'video/*'])).toBe(false)
  })

  it('should match everything with a full wildcard', () => {
    expect(isMediaTypeAllowed('application/pdf', ['*/*'])).toBe(true)
  })

  it('should ignore case', () => {
    expect(isMediaTypeAllowed('Image/PNG', ['image/*'])).toBe(true)
  })

  it('should reject everything when no type is allowed', () => {
    expect(isMediaTypeAllowed('image/png', [])).toBe(false)
  })
})

describe('parseDataUrl', () => {
  it('should drop data URL parameters from the media type', () => {
    expect(parseDataUrl('data:text/plain;charset=utf-8;base64,aGk=')).toEqual({ mimeType: 'text/plain', base64: 'aGk=' })
  })

  it('should return undefined for a data URL that is not base64', () => {
    expect(parseDataUrl('data:text/plain,hello')).toBeUndefined()
  })
})
