import { describe, expect, test } from 'vitest'
import { resolveIconPickerLibraries } from '../../../src/utils/resolveIconPickerLibraries'

describe('resolveIconPickerLibraries', () => {
  test('uses field options when non-empty', () => {
    expect(resolveIconPickerLibraries(['lucide'], ['mdi'])).toEqual(['lucide'])
  })

  test('falls back to global when field has no options', () => {
    expect(resolveIconPickerLibraries(undefined, ['material-symbols'])).toEqual(['material-symbols'])
  })

  test('returns all when field is empty array and global unset', () => {
    expect(resolveIconPickerLibraries([], undefined)).toBe('all')
  })

  test('returns all when neither field nor global apply', () => {
    expect(resolveIconPickerLibraries(undefined, undefined)).toBe('all')
  })

  test('ignores empty global array', () => {
    expect(resolveIconPickerLibraries(undefined, [])).toBe('all')
  })
})
