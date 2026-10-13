import { describe, it, expect } from 'vitest'
import { isSafeStorageKey, mediaItemFieldsFromKey } from '../../src/runtime/utils/media'

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

describe('isSafeStorageKey', () => {
  it('should accept regular, nested and list keys', () => {
    expect(isSafeStorageKey('demo.mp4')).toBe(true)
    expect(isSafeStorageKey('images:sub:photo.png')).toBe(true)
    expect(isSafeStorageKey('images/my%20photo.png')).toBe(true)
    expect(isSafeStorageKey('images:')).toBe(true)
    expect(isSafeStorageKey('')).toBe(true)
  })

  it('should accept dots that are not a whole segment', () => {
    expect(isSafeStorageKey('archive..tar.gz')).toBe(true)
    expect(isSafeStorageKey('images:.hidden.png')).toBe(true)
    expect(isSafeStorageKey('v1.2.3:logo.svg')).toBe(true)
  })

  it('should reject dot segments with any separator', () => {
    expect(isSafeStorageKey('images:..:..:secret.json')).toBe(false)
    expect(isSafeStorageKey('images/../secret.json')).toBe(false)
    expect(isSafeStorageKey('..')).toBe(false)
    expect(isSafeStorageKey('images:.:photo.png')).toBe(false)
  })

  it('should reject encoded and double-encoded dot segments', () => {
    expect(isSafeStorageKey('images:%2e%2e:secret.json')).toBe(false)
    expect(isSafeStorageKey('images:%252e%252e:secret.json')).toBe(false)
    expect(isSafeStorageKey('images%2F..%2Fsecret.json')).toBe(false)
  })

  it('should reject dot segments disguised with whitespace or control characters', () => {
    expect(isSafeStorageKey('images:.%09.:secret.json')).toBe(false)
    expect(isSafeStorageKey('images:.\t.:secret.json')).toBe(false)
    expect(isSafeStorageKey('images:..%20:secret.json')).toBe(false)
    expect(isSafeStorageKey('images:..%01:secret.json')).toBe(false)
    expect(isSafeStorageKey('images:...:secret.json')).toBe(false)
    expect(isSafeStorageKey('photo%00.png')).toBe(false)
  })

  it('should reject query, fragment, backslash and malformed keys', () => {
    expect(isSafeStorageKey('photo.png?acl')).toBe(false)
    expect(isSafeStorageKey('photo.png%3Facl')).toBe(false)
    expect(isSafeStorageKey('photo.png#x')).toBe(false)
    expect(isSafeStorageKey('images\\..\\secret.json')).toBe(false)
    expect(isSafeStorageKey('100%.png')).toBe(false)
  })
})
