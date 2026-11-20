import { afterEach, describe, expect, test, vi } from 'vitest'
import { restoreSelectFocus } from '../../../src/utils/select'

// Tests run without a DOM: model the closing menu, the shadow root it lives in and the trigger.
function closeMenu(focused: 'option' | 'elsewhere' | 'nothing') {
  const option = {}
  const activeElement = { option, elsewhere: {}, nothing: null }[focused]
  const menu = {
    contains: (node: unknown) => node === option,
    getRootNode: () => ({ activeElement }),
  }
  const trigger = { focus: vi.fn() }

  return {
    event: { target: menu } as unknown as Event,
    trigger: trigger as unknown as HTMLElement,
    focus: trigger.focus,
  }
}

describe('select', () => {
  describe('restoreSelectFocus', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    test('returns focus to the trigger while an option of the closing menu is focused', () => {
      const { event, trigger, focus } = closeMenu('option')

      restoreSelectFocus(event, trigger)

      expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true })
    })

    test('returns focus to the trigger when nothing is focused anymore', () => {
      const { event, trigger, focus } = closeMenu('nothing')

      restoreSelectFocus(event, trigger)

      expect(focus).toHaveBeenCalledOnce()
    })

    test('leaves focus alone when it already moved elsewhere in Studio', () => {
      const { event, trigger, focus } = closeMenu('elsewhere')

      restoreSelectFocus(event, trigger)

      expect(focus).not.toHaveBeenCalled()
    })

    test('ignores the document active element, which is always Studio\'s shadow host', () => {
      vi.stubGlobal('document', { activeElement: { tagName: 'NUXT-STUDIO' } })
      const { event, trigger, focus } = closeMenu('option')

      restoreSelectFocus(event, trigger)

      expect(focus).toHaveBeenCalledOnce()
    })

    test('does nothing when the trigger is gone', () => {
      const { event } = closeMenu('option')

      expect(() => restoreSelectFocus(event)).not.toThrow()
    })
  })
})
