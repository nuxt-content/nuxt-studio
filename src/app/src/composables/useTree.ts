import type { DatabaseItem, StudioHost, TreeItem, DraftItem, MediaItem } from '../types'
import { StudioFeature, TreeStatus, DraftStatus } from '../types'
import { ref, computed } from 'vue'
import type { useDraftDocuments } from './useDraftDocuments'
import type { useDraftMedias } from './useDraftMedias'
import { buildTree, findItemFromFsPath, findItemFromRoute, findParentFromFsPath } from '../utils/tree'
import type { RouteLocationNormalized } from 'vue-router'
import { useHooks } from './useHooks'
import { useStudioState } from './useStudioState'
import { useAI } from './useAI'

export const useTree = (type: StudioFeature, host: StudioHost, draft: ReturnType<typeof useDraftDocuments | typeof useDraftMedias>) => {
  const hooks = useHooks()
  const { preferences, setLocation, devMode } = useStudioState()
  const { contextFolder } = useAI()

  const tree = ref<TreeItem[]>([])

  const rootItem = computed<TreeItem>(() => {
    const draftedTreeItems = draft.list.value.filter(draft => draft.status !== DraftStatus.Pristine)
    let name = 'content'
    let fsPath = '/'

    if (type === StudioFeature.Media) {
      name = 'public'
    }
    else if (type === StudioFeature.AI) {
      name = contextFolder
      fsPath = contextFolder
    }

    return {
      name,
      type: 'root',
      fsPath,
      children: tree.value,
      status: draftedTreeItems.length > 0 ? TreeStatus.Updated : null,
      prefix: null,
    } as TreeItem
  })

  const currentItem = ref<TreeItem>(rootItem.value)

  const currentTree = computed<TreeItem[]>(() => {
    if (currentItem.value.type === 'root') {
      return tree.value
    }

    let subTree = tree.value
    const fsPathSegments = currentItem.value.fsPath.split('/').filter(Boolean)
    for (let i = 0; i < fsPathSegments.length; i++) {
      const fsPath = fsPathSegments.slice(0, i + 1).join('/')
      const file = subTree.find(item => item.fsPath === fsPath) as TreeItem
      if (file) {
        subTree = file.children!
      }
    }

    return subTree
  })

  async function select(item: TreeItem) {
    currentItem.value = item || rootItem.value

    setLocation(type, currentItem.value.fsPath)

    if (item?.type === 'file') {
      await draft.selectByFsPath(item.fsPath)

      if (
        !preferences.value.syncEditorAndRoute
        || type === StudioFeature.Media
        || item.name === '.navigation'
        || !item.routePath
      ) {
        return
      }

      host.app.navigateTo(item.routePath)
    }
    else {
      draft.unselect()
    }
  }

  async function selectByRoute(route: RouteLocationNormalized) {
    const item = findItemFromRoute(tree.value, route)

    if (!item || item.fsPath === currentItem.value.fsPath) return

    await select(item)
  }

  async function selectItemByFsPath(fsPath: string) {
    const treeItem = findItemFromFsPath(tree.value, fsPath)

    if (!treeItem) {
      await select(rootItem.value)
      return
    }

    if (treeItem.fsPath === currentItem.value.fsPath) return

    await select(treeItem)
  }

  async function selectParentByFsPath(fsPath: string) {
    const parent = findParentFromFsPath(tree.value, fsPath)
    await select(parent || rootItem.value)
  }

  // Trigger tree rebuild to update files status
  async function handleDraftUpdate(selectItem: boolean = true) {
    let draftList: DraftItem<DatabaseItem | MediaItem>[]
    let dbList: DatabaseItem[]

    // Media
    if (type === StudioFeature.Media) {
      dbList = await host.media.list() as DatabaseItem[]
      draftList = draft.list.value
    }
    // Content
    else {
      const allDbItems = await host.document.db.list() as DatabaseItem[]
      const allDraftItems = draft.list.value

      const isInContextFolder = (item: DatabaseItem | DraftItem<DatabaseItem | MediaItem>) => {
        if (!contextFolder) return false

        return item.fsPath?.startsWith(`${contextFolder}/`)
      }

      if (type === StudioFeature.AI) {
        dbList = allDbItems.filter(isInContextFolder)
        draftList = allDraftItems.filter(isInContextFolder)
      }
      else {
        dbList = allDbItems.filter(item => !isInContextFolder(item))
        draftList = allDraftItems.filter(item => !isInContextFolder(item))
      }
    }

    tree.value = buildTree(dbList, draftList, devMode.value)

    // Reselect current item to update status
    if (selectItem) {
      const item = findItemFromFsPath(tree.value, currentItem.value.fsPath)
      if (item) {
        select(item)
      }
    }

    // Rerender host app
    host.app.requestRerender()
  }

  if (type === StudioFeature.Media) {
    hooks.hook('studio:draft:media:updated', async ({ caller }) => {
      console.info('studio:draft:media:updated have been called by', caller)
      await handleDraftUpdate(caller !== 'useDraftBase.load')
    })
  }
  else if (type === StudioFeature.AI) {
    hooks.hook('studio:draft:ai:updated', async ({ caller }) => {
      console.info('studio:draft:ai:updated have been called by', caller)
      await handleDraftUpdate(caller !== 'useDraftBase.load')
    })
  }
  else {
    // Content and AI trees listen to document updates
    hooks.hook('studio:draft:document:updated', async ({ caller }) => {
      console.info('studio:draft:document:updated have been called by', caller)
      await handleDraftUpdate(caller !== 'useDraftBase.load')
    })
  }

  return {
    root: tree,
    rootItem,
    current: currentTree,
    currentItem,
    // parentItem,
    select,
    selectByRoute,
    selectItemByFsPath,
    selectParentByFsPath,
    type,
    draft,
  }
}
