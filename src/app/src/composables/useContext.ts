import { createSharedComposable } from '@vueuse/core'
import { computed, ref } from 'vue'
import type { useUi } from './useUi'
import { type CreateFileParams, type StudioHost, type StudioAction, type TreeItem, StudioItemActionId } from '../types'
import { oneStepActions, STUDIO_ITEM_ACTION_DEFINITIONS, twoStepActions } from '../utils/context'
import type { useDraftFiles } from './useDraftFiles'

export const useContext = createSharedComposable((
  host: StudioHost,
  ui: ReturnType<typeof useUi>,
  draftFiles: ReturnType<typeof useDraftFiles>,
) => {
  const actionInProgress = ref<StudioItemActionId | null>(null)
  const currentFeature = computed<keyof typeof ui.panels | null>(() =>
    Object.keys(ui.panels).find(key => ui.panels[key as keyof typeof ui.panels]) as keyof typeof ui.panels,
  )

  const itemActions = computed<StudioAction[]>(() => {
    return STUDIO_ITEM_ACTION_DEFINITIONS.map(action => ({
      ...action,
      handler: async (...args: any) => {
        if (actionInProgress.value === action.id) {
          // Two steps actions need to be already in progress to be executed
          if (twoStepActions.includes(action.id)) {
            await itemActionHandler[action.id](...args)
            unsetActionInProgress()
            return
          }
          // One step actions can't be executed if already in progress
          else {
            return
          }
        }

        actionInProgress.value = action.id

        // One step actions can be executed immediately
        if (oneStepActions.includes(action.id)) {
          await itemActionHandler[action.id](...args)
          unsetActionInProgress()
        }
      },
    }))
  })

  const itemActionHandler: Record<StudioItemActionId, (...args: any) => Promise<void>> = {
    [StudioItemActionId.CreateFolder]: async (id: string) => {
      console.log('create folder', id)
      alert(`create folder ${id}`)
    },
    [StudioItemActionId.CreateFile]: async ({ fsPath, routePath, content }: CreateFileParams) => {
      const document = await host.document.create(fsPath, routePath, content)
      await draftFiles.upsert(document.id, document)

      alert(`created file ${fsPath} ${content} !`)
    },
    [StudioItemActionId.RevertItem]: async (id: string) => {
      alert(`revert file ${id}`)
    },
    [StudioItemActionId.RenameItem]: async ({ path, file }: { path: string, file: TreeItem }) => {
      alert(`rename file ${path} ${file.name}`)
    },
    [StudioItemActionId.DeleteItem]: async (id: string) => {
      alert(`delete file ${id}`)
    },
    [StudioItemActionId.DuplicateItem]: async (id: string) => {
      alert(`duplicate file ${id}`)
    },
  }

  function unsetActionInProgress() {
    actionInProgress.value = null
  }

  return {
    feature: currentFeature,
    // itemActionHandler,
    itemActions,
    actionInProgress,

    unsetActionInProgress,
    itemActionHandler,
  }
})
