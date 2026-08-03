<script setup lang="ts">
import { computed } from 'vue'
import { useStudio } from '../composables/useStudio'
import { StudioItemActionId, StudioFeature } from '../types'

const { context, mediaTree } = useStudio()
// Exposed by useDraftMedias for both drag & drop and toolbar uploads.
const isUploading = computed(() => (mediaTree.draft as { isUploading?: { value: boolean } }).isUploading?.value ?? false)

const folderTree = computed(() => (mediaTree.current.value || []).filter(f => f.type === 'directory'))
const fileTree = computed(() => (mediaTree.current.value || []).filter(f => f.type === 'file' && !f.fsPath.endsWith('.gitkeep')))

const currentTreeItem = computed(() => mediaTree.currentItem.value)
const currentDraftItem = computed(() => mediaTree.draft.current.value)

const showFolderForm = computed(() => {
  return context.actionInProgress.value?.id === StudioItemActionId.CreateMediaFolder
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

async function onFileDrop(event: DragEvent) {
  if (currentDraftItem.value) {
    return
  }

  if (event.dataTransfer?.files) {
    await context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: currentTreeItem.value.fsPath,
      files: Array.from(event.dataTransfer.files),
    })
  }
}
</script>

<template>
  <div
    class="h-full flex flex-col"
    @drop.prevent.stop="onFileDrop"
    @dragover.prevent.stop
  >
    <div class="flex items-center justify-between gap-2 px-4 py-1 border-b-[0.5px] border-default bg-muted/70">
      <ItemBreadcrumb />
      <ItemActionsToolbar />
    </div>

    <div class="flex-1 relative">
      <div
        v-if="mediaTree.draft.isLoading.value"
        class="absolute inset-0 bg-primary/3 animate-pulse pointer-events-none"
      />

      <div
        v-if="isUploading"
        class="absolute inset-0 z-20 flex items-center justify-center bg-default/70 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-2 rounded-lg border border-default bg-default px-6 py-4 shadow-lg">
          <UIcon
            name="i-lucide-loader-circle"
            class="size-6 animate-spin text-primary"
          />
          <span class="text-sm font-medium text-foreground">{{ $t('studio.actions.loading.uploading') }}</span>
        </div>
      </div>

      <template v-if="!mediaTree.draft.isLoading.value">
        <MediaEditor
          v-if="currentTreeItem.type === 'file' && currentDraftItem"
          :media-item="currentDraftItem.modified || currentDraftItem.original!"
          :remote-file="currentDraftItem.remoteFile!"
          :status="currentDraftItem.status"
        />
        <div
          v-else
          class="bg-default h-full"
          :class="{ 'bg-primary/3 animate-pulse': isUploading }"
        >
          <div class="flex flex-col p-4">
            <div v-if="folderTree?.length > 0 || showFolderForm">
              <div class="flex items-center gap-1 mb-3">
                <UIcon
                  name="i-lucide-folder"
                  class="size-3.5 text-muted"
                />
                <h3 class="text-xs uppercase tracking-wider text-muted">
                  {{ $t('studio.headings.directories') }}
                </h3>
                <UBadge
                  v-if="folderTree?.length > 0"
                  :label="folderTree.length.toString()"
                  color="neutral"
                  variant="soft"
                  size="xs"
                />
                <div class="flex-1 h-px bg-border ml-2" />
              </div>
              <ItemTree
                class="mb-6"
                :tree="folderTree"
                :show-form="showFolderForm"
                :feature="StudioFeature.Media"
              />
            </div>
            <div>
              <div class="flex items-center gap-1 mb-3">
                <UIcon
                  name="i-lucide-image"
                  class="size-3.5 text-muted"
                />
                <h3 class="text-xs uppercase tracking-wider text-muted">
                  {{ $t('studio.headings.media') }}
                </h3>
                <UBadge
                  :label="fileTree.length.toString()"
                  color="neutral"
                  variant="soft"
                  size="xs"
                />
                <div class="flex-1 h-px bg-border ml-2" />
              </div>
              <ItemTree
                :tree="fileTree"
                :show-form="showFileForm"
                :feature="StudioFeature.Media"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
