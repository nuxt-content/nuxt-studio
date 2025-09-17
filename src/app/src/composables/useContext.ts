import { createSharedComposable } from '@vueuse/core'
import { computed } from 'vue'
import type { useUi } from './useUi'
import { type StudioHost, type StudioAction, type TreeItem, StudioActionId } from '../types'
import { STUDIO_ITEM_ACTION_DEFINITIONS } from '../utils/context'

export const useContext = createSharedComposable((_host: StudioHost, ui: ReturnType<typeof useUi>) => {
  const currentFeature = computed<keyof typeof ui.panels | null>(() => Object.keys(ui.panels).find(key => ui.panels[key as keyof typeof ui.panels]) as keyof typeof ui.panels)

  const itemActions = computed<StudioAction[]>(() => {
    return STUDIO_ITEM_ACTION_DEFINITIONS.map(action => ({
      ...action,
      handler: async (...args: never) => {
        await itemActionHandler[action.id](...args)
      },
    }))
  })

  const itemActionHandler: Record<StudioActionId, (...args: never) => Promise<void>> = {
    [StudioActionId.CreateFolder]: async (id: string) => {
      console.log('create folder', id)
      alert(`create folder ${id}`)
    },
    [StudioActionId.CreateFile]: async ({ path, content }: { path: string, content?: string }) => {
      alert(`create file ${path} ${content}`)
    },
    [StudioActionId.RevertItem]: async (id: string) => {
      alert(`revert file ${id}`)
    },
    [StudioActionId.RenameItem]: async ({ path, file }: { path: string, file: TreeItem }) => {
      alert(`rename file ${path} ${file.name}`)
    },
    [StudioActionId.DeleteItem]: async (id: string) => {
      alert(`delete file ${id}`)
    },
    [StudioActionId.DuplicateItem]: async (id: string) => {
      alert(`duplicate file ${id}`)
    },
  }

  return {
    feature: currentFeature,
    itemActions,
  }
})
