import { describe, it, expect } from 'vitest'
import { mediaItemFieldsFromKey } from '../../src/runtime/utils/media'

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
