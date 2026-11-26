import { describe, it, expect } from 'vitest'
import { doObjectsMatch } from '../../src/runtime/utils/object'

describe('doObjectsMatch', () => {
  it('should not match null with a non-empty object', () => {
    expect(doObjectsMatch({ image: null }, { image: { src: '/a.png' } })).toBe(false)
  })

  it('should not match a non-empty object with null', () => {
    expect(doObjectsMatch({ image: { src: '/a.png' } }, { image: null })).toBe(false)
  })

  it('should treat empty values as a missing key', () => {
    expect(doObjectsMatch({ title: 'A', tags: [], image: {}, cover: null, subtitle: '' }, { title: 'A' })).toBe(true)
  })

  it('should still compare the values of keys both objects have', () => {
    expect(doObjectsMatch({ title: 'A', tags: ['x'] }, { title: 'A', tags: ['y'] })).toBe(false)
  })
})
