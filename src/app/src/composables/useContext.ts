import { createSharedComposable } from '@vueuse/core'
import { computed, ref } from 'vue'
import {
  type UploadMediaParams,
  type CreateFileParams,
  type StudioHost,
  type StudioAction,
  type ActionHandlerParams,
  type StudioActionInProgress,
  StudioItemActionId,
} from '../types'
import { oneStepActions, STUDIO_ITEM_ACTION_DEFINITIONS, twoStepActions } from '../utils/context'
import { useModal } from './useModal'
import type { useTree } from './useTree'
import { useRoute } from 'vue-router'
import { findDescendantsFileItemsFromId } from '../utils/tree'
import type { useDraftMedias } from './useDraftMedias'

export const useContext = createSharedComposable((
  host: StudioHost,
  documentTree: ReturnType<typeof useTree>,
  mediaTree: ReturnType<typeof useTree>,
) => {
  const modal = useModal()
  const route = useRoute()

  const actionInProgress = ref<StudioActionInProgress | null>(null)
  const activeTree = computed(() => {
    if (route.name === 'media') {
      return mediaTree
    }
    return documentTree
  })

  const itemActions = computed<StudioAction[]>(() => {
    return STUDIO_ITEM_ACTION_DEFINITIONS.map(action => ({
      ...action,
      handler: async (args) => {
        if (actionInProgress.value?.id === action.id) {
          // Two steps actions need to be already in progress to be executed
          if (twoStepActions.includes(action.id)) {
            await itemActionHandler[action.id](args as never)
            unsetActionInProgress()
            return
          }
          // One step actions can't be executed if already in progress
          else {
            return
          }
        }

        actionInProgress.value = { id: action.id, item: args.item }

        // One step actions can be executed immediately
        if (oneStepActions.includes(action.id)) {
          await itemActionHandler[action.id](args as never)
          unsetActionInProgress()
        }
      },
    }))
  })

  const itemActionHandler: { [K in StudioItemActionId]: (args: ActionHandlerParams[K]) => Promise<void> } = {
    [StudioItemActionId.CreateFolder]: async (args: string) => {
      alert(`create folder ${args}`)
    },
    [StudioItemActionId.CreateDocument]: async ({ fsPath, routePath, content }: CreateFileParams) => {
      const document = await host.document.create(fsPath, routePath, content)
      const draftItem = await activeTree.value.draft.create(document)
      await activeTree.value.selectItemById(draftItem.id)
    },
    [StudioItemActionId.UploadMedia]: async ({ directory, files }: UploadMediaParams) => {
      for (const file of files) {
        await (activeTree.value.draft as ReturnType<typeof useDraftMedias>).upload(directory, file)
      }
    },
    [StudioItemActionId.RevertItem]: async (id: string) => {
      modal.openConfirmActionModal(id, StudioItemActionId.RevertItem, async () => {
        await activeTree.value.draft.revert(id)
      })
    },
    [StudioItemActionId.RenameItem]: async ({ id, newNameWithExtension }: { id: string, newNameWithExtension: string }) => {
      alert(`rename file ${id} ${newNameWithExtension}`)
    },
    [StudioItemActionId.DeleteItem]: async (id: string) => {
      modal.openConfirmActionModal(id, StudioItemActionId.DeleteItem, async () => {
        const ids: string[] = findDescendantsFileItemsFromId(activeTree.value.root.value, id).map(item => item.id)
        await activeTree.value.draft.remove(ids)
        await activeTree.value.selectParentById(id)
      })
    },
    [StudioItemActionId.DuplicateItem]: async (id: string) => {
      const draftItem = await activeTree.value.draft.duplicate(id)
      await activeTree.value.selectItemById(draftItem.id)
    },
  }

  function unsetActionInProgress() {
    actionInProgress.value = null
  }

  return {
    activeTree,
    itemActions,
    actionInProgress,

    unsetActionInProgress,
    itemActionHandler,
  }
})
