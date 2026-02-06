import { vi } from 'vitest'

// Mock window.useStudioHost for test environment
global.window = {
  ...global.window,
  useStudioHost: vi.fn(() => ({
    meta: {
      ai: {
        enabled: false,
        context: undefined,
      },
    },
  })),
} as never
