import type { StudioHost, TreeItem } from '../types'
import { ref, watch, computed } from 'vue'
import type { useDraftFiles } from './useDraftFiles'
import { findParentFromId, buildTree, findItemFromRoute } from '../utils/tree'
import type { RouteLocationNormalized } from 'vue-router'

export function useTree(host: StudioHost, draftFiles: ReturnType<typeof useDraftFiles>) {
  const tree = ref<TreeItem[]>([])
  const currentItem = ref<TreeItem | null>(null)

  const currentTree = computed<TreeItem[]>(() => {
    if (!currentItem.value) {
      return tree.value
    }

    let subTree = tree.value
    const parts = currentItem.value.path.split('/').filter(Boolean)
    for (let i = 0; i < parts.length; i++) {
      const fileName = parts[i]
      const file = subTree.find(f => f.name === fileName) as TreeItem
      if (file) {
        subTree = file.children!
      }
    }

    return subTree
  })

  // const parentItem = computed<TreeItem | null>(() => {
  //   if (!currentItem.value) return null

  //   const parent = findParentFromId(tree.value, currentItem.value.id)
  //   return parent || { name: 'content', path: '../', type: 'directory' } as TreeItem
  // })

  async function selectItem(item: TreeItem | null) {
    currentItem.value = item
    if (item?.type === 'file') {
      host.app.navigateTo(item.routePath!)
      await selectCorrespondingDraftFile(item)
    }
    else {
      draftFiles.select(null)
    }
  }

  async function selectByRoute(route: RouteLocationNormalized) {
    const item = findItemFromRoute(tree.value, route)
    if (!item) return
    currentItem.value = item
    await selectCorrespondingDraftFile(item)
  }

  async function selectCorrespondingDraftFile(item: TreeItem) {
    const originalDatabaseItem = await host.document.get(item.id)
    const draftFileItem = await draftFiles.upsert(item.id, originalDatabaseItem)
    draftFiles.select(draftFileItem)
  }

  watch(draftFiles.list, async () => {
    const list = await host.document.list()
    tree.value = buildTree(list, draftFiles.list.value)
  }, { deep: true })

  return {
    root: tree,
    current: currentTree,
    currentItem,
    // parentItem,
    selectItem,
    selectByRoute,
  }
}
