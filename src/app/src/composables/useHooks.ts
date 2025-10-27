import { createSharedComposable } from '@vueuse/core'
import { createHooks } from 'hookable'

export const useHooks = createSharedComposable(() => {
  return createHooks<{
    'studio:draft:document:updated': (
      { caller, selectItem }: { caller: string, selectItem?: boolean }
    ) => void
    'studio:draft:media:updated': (
      { caller, selectItem }: { caller: string, selectItem?: boolean }
    ) => void
  }>()
})
