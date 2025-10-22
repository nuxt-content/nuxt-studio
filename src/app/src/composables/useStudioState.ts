import { useStorage, createSharedComposable } from '@vueuse/core'
import type { StudioConfig, StudioLocation } from '../types'
import { TreeRootId } from '../types'
import { StudioFeature } from '../types/context'

export const useStudioState = createSharedComposable(() => {
  const preferences = useStorage<StudioConfig>('studio-preferences', { syncEditorAndRoute: true, showTechnicalMode: false })
  const location = useStorage<StudioLocation>('studio-active', { feature: StudioFeature.Content, itemId: TreeRootId.Content })

  return {
    preferences,
    location,
  }
})
