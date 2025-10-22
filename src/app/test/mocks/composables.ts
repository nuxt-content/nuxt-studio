import { vi } from 'vitest'
import { ref } from 'vue'
import type { useUI } from '../../src/composables/useUI'

export const createMockStorage = () => new Map<string, string>()

export const createMockUI = (): ReturnType<typeof useUI> => {
  return {
    colorMode: ref('light'),
    sidebar: {} as never,
    isOpen: ref(false),
    open: vi.fn(),
    toggle: vi.fn(() => true),
    close: vi.fn(() => false) as never,
  }
}
