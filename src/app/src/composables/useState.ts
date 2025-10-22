import { useStorage, createSharedComposable } from '@vueuse/core'
import type { StudioConfig } from '../types/config'

export const useState = createSharedComposable(() => {
  const config = useStorage<StudioConfig>('studio-config', { syncEditorAndRoute: true, showTechnicalMode: false })

  return {
    config,
  }
})
