<script setup lang="ts">
import { computed } from 'vue'
import { useStudio } from '../composables/useStudio'
import type { TreeItem } from '../types'
import { StudioItemActionId, TreeStatus } from '../types'

const { documentTree, context, ui } = useStudio()

const folderTree = computed(() => (documentTree.current.value || []).filter(f => f.type === 'directory'))
const fileTree = computed(() => (documentTree.current.value || []).filter(f => f.type === 'file'))

const showFolderForm = computed(() => {
  return context.actionInProgress.value?.id === StudioItemActionId.CreateFolder
    || (
      context.actionInProgress.value?.id === StudioItemActionId.RenameItem
      && context.actionInProgress.value?.item?.type === 'directory'
    )
})

const showFileForm = computed(() => {
  return context.actionInProgress.value?.id === StudioItemActionId.CreateDocument
    || (
      context.actionInProgress.value?.id === StudioItemActionId.RenameItem
      && context.actionInProgress.value?.item?.type === 'file')
})

function fileIcon(id: string) {
  return {
    md: 'i-ph-markdown-logo',
    yaml: 'i-fluent-document-yml-20-regular',
    yml: 'i-fluent-document-yml-20-regular',
    json: 'i-lucide-file-json',
  }[id.split('.').pop() as string] || 'i-lucide-file-text'
}

function mapTreeToItem(tree: TreeItem[]) {
  return tree.map((treeItem) => {
    if (treeItem.type === 'file') {
      return {
        type: 'file',
        label: treeItem.name,
        icon: fileIcon(treeItem.id),
        onSelect: () => context.activeTree.value.select(treeItem),
      }
    }
    return {
      type: 'directory',
      label: treeItem.name,
      icon: 'i-lucide-folder',
      // onSelect: () => context.activeTree.value.select(treeItem),
      children: treeItem.children ? mapTreeToItem(treeItem.children) : [],
    }
  }).sort((a) => {
    // sort by directory first
    if (a.type === 'directory') {
      return -1
    }
    return 1
  })
}

const items = computed(() => {
  if (documentTree.currentItem.value.type === 'file') {
    return []
  }
  return mapTreeToItem(documentTree.current.value)
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-2 px-4 py-1 border-b-[0.5px] border-default bg-muted/70">
      <ItemBreadcrumb />
      <ItemActionsToolbar />
    </div>
    <ContentEditor
      v-if="documentTree.currentItem.value.type === 'file' && documentTree.draft.current.value"
      :draft-item="documentTree.draft.current.value!"
      :read-only="documentTree.currentItem.value.status === TreeStatus.Deleted"
    />
    <div
      v-else-if="ui.config.value.showTechnicalMode"
      class="flex flex-col p-4 text-white"
    >
      <UTree
        :items="items"
        color="neutral"
        :ui="{ linkTrailingIcon: 'text-dimmed' }"
      />
    </div>
    <div
      v-else
      class="flex flex-col p-4"
    >
      <ItemTree
        v-if="folderTree?.length > 0 || showFolderForm"
        class="mb-2"
        :tree="folderTree"
        :show-form="showFolderForm"
        type="directory"
      />
      <ItemTree
        v-if="fileTree?.length > 0 || showFileForm"
        :tree="fileTree"
        :show-form="showFileForm"
        type="file"
      />
    </div>
  </div>
</template>
