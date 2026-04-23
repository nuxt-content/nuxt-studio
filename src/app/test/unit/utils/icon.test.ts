import { describe, expect, test } from 'vitest'
import { resolveIconLibraries } from '../../../src/utils/icon'

describe('icon', () => {
  describe('resolveIconLibraries', () => {
    test('uses field options when non-empty', () => {
      expect(resolveIconLibraries(['lucide'], ['mdi'])).toEqual(['lucide'])
    })

    test('falls back to global when field has no options', () => {
      expect(resolveIconLibraries(undefined, ['material-symbols'])).toEqual(['material-symbols'])
    })

    test('returns all when field is empty array and global unset', () => {
      expect(resolveIconLibraries([], undefined)).toBe('all')
    })

    test('returns all when neither field nor global apply', () => {
      expect(resolveIconLibraries(undefined, undefined)).toBe('all')
    })

    test('ignores empty global array', () => {
      expect(resolveIconLibraries(undefined, [])).toBe('all')
    })

    test('falls back to global when field is empty array', () => {
      expect(resolveIconLibraries([], ['mdi'])).toEqual(['mdi'])
    })
  })
})
