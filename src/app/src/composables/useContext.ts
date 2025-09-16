import { createSharedComposable } from '@vueuse/core'
import { computed } from 'vue'
import type { useUi } from './useUi'
import type { StudioHost, StudioAction, TreeItem } from '../types'
import { STUDIO_ACTION_DEFINITIONS } from '../utils/context'

export const useContext = createSharedComposable((_host: StudioHost, ui: ReturnType<typeof useUi>) => {
  const currentFeature = computed<keyof typeof ui.panels | null>(() => Object.keys(ui.panels).find(key => ui.panels[key as keyof typeof ui.panels]) as keyof typeof ui.panels)

  const studioActions = computed<StudioAction[]>(() => {
    return STUDIO_ACTION_DEFINITIONS.map(definition => ({
      ...definition,
      click: getActionHandler(definition.id),
    }))
  })

  function getActionHandler(actionId: string) {
    switch (actionId) {
      case 'create-folder':
        return async (id: string) => {
          alert(`create folder ${id}`)
        }
      case 'create-file':
        return async ({ path, content }: { path: string, content?: string }) => {
          alert(`create file ${path} ${content}`)
        }
      case 'revert-file':
        return (id: string) => {
          alert(`revert file ${id}`)
        }
      case 'rename-file':
        return async ({ path, file }: { path: string, file: TreeItem }) => {
          alert(`rename file ${path} ${file.name}`)
        }
      case 'delete-file':
        return (id: string) => {
          alert(`delete file ${id}`)
        }
      case 'duplicate-file':
        return async (id: string) => {
          alert(`duplicate file ${id}`)
        }
      default:
        return () => console.warn(`Unknown action: ${actionId}`)
    }
  }

  return {
    feature: currentFeature,
    studioActions,
  }
})
