import { expect, test, describe } from 'vitest'
import { pickInitialSlot } from '../../../../src/utils/tiptap/handlers'

describe('pickInitialSlot', () => {
  test('returns undefined for no slots', () => {
    expect(pickInitialSlot(undefined)).toBeUndefined()
    expect(pickInitialSlot([])).toBeUndefined()
  })

  test('returns the only slot name when there is one', () => {
    expect(pickInitialSlot([{ name: 'header' }])).toBe('header')
  })

  test('prefers default over other slots', () => {
    expect(pickInitialSlot([{ name: 'footer' }, { name: 'default' }, { name: 'header' }])).toBe('default')
  })

  test('sorts non-default slots alphabetically when no default exists', () => {
    expect(pickInitialSlot([{ name: 'footer' }, { name: 'body' }, { name: 'header' }])).toBe('body')
  })

  test('does not mutate the original array', () => {
    const slots = [{ name: 'footer' }, { name: 'default' }]
    pickInitialSlot(slots)
    expect(slots[0]!.name).toBe('footer')
  })
})
