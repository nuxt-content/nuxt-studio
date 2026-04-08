<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../composables/useStudio'
import { isImageFile, isVideoFile } from '../../utils/file'
import { filterDirectories, findDirectoryItem, findItemFromFsPath } from '../../utils/tree'
import type { TreeItem } from '../../types'
import { StudioFeature } from '../../types'
import ImagePreview from './media-picker/ImagePreview.vue'
import VideoPreview from './media-picker/VideoPreview.vue'

const ITEMS_PER_PAGE = 12

const { mediaTree, context } = useStudio()
const { t } = useI18n()

const props = defineProps<{ open: boolean, type: 'image' | 'video' }>()

const emit = defineEmits<{
  select: [image: TreeItem | null]
  cancel: []
}>()

const searchRef = useTemplateRef<{ $el: HTMLElement }>('searchInput')
const page = ref(1)
const search = ref('')
const selectedFolderFsPath = ref<string | null>(null)

watch([search, selectedFolderFsPath], async ([newSearch], [prevSearch]) => {
  page.value = 1
  if (newSearch !== prevSearch) {
    await nextTick()
    searchRef.value?.$el.querySelector('input')?.focus()
  }
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    selectedFolderFsPath.value = null
  }
})

const folderTreeItems = computed<TreeItem[]>(() => [filterDirectories(mediaTree.rootItem.value)])
watch(folderTreeItems, (items) => {
  if (selectedFolderFsPath.value && !findItemFromFsPath(items, selectedFolderFsPath.value)) {
    selectedFolderFsPath.value = null
  }
}, { immediate: true })

const selectedFolderTreeItem = computed<TreeItem | undefined>({
  get() {
    if (!selectedFolderFsPath.value) {
      return undefined
    }

    return findItemFromFsPath(folderTreeItems.value, selectedFolderFsPath.value) ?? undefined
  },
  set(item) {
    if (!item?.fsPath) {
      return
    }

    selectedFolderFsPath.value = item.fsPath
  },
})

const selectedFolder = computed(() => {
  if (!selectedFolderFsPath.value) {
    return undefined
  }

  return findDirectoryItem(mediaTree.rootItem.value, selectedFolderFsPath.value)
})

const selectedFolderPath = computed(() => {
  if (!selectedFolder.value) {
    return t('studio.form.icon.allLibraries')
  }

  if (selectedFolder.value.type === 'root') {
    return t('studio.mediaPicker.rootFolder')
  }

  return `${mediaTree.rootItem.value.name}/${selectedFolder.value.fsPath}`
})

const allMediaFiles = computed<TreeItem[]>(() => {
  const medias: TreeItem[] = []

  const collectMedias = (items: TreeItem[]) => {
    for (const item of items) {
      if (item.type === 'file' && !item.fsPath.endsWith('.gitkeep') && isValidFileType(item)) {
        medias.push(item)
      }

      if (item.children?.length) {
        collectMedias(item.children)
      }
    }
  }

  collectMedias(mediaTree.root.value)

  return medias
})

const mediaFiles = computed<TreeItem[]>(() => {
  if (!selectedFolder.value) {
    return allMediaFiles.value
  }

  return (selectedFolder.value.children || []).filter((item): item is TreeItem => {
    return item.type === 'file' && !item.fsPath.endsWith('.gitkeep') && isValidFileType(item)
  })
})

const filteredMediaFiles = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return mediaFiles.value
  }

  return mediaFiles.value.filter(file => file.fsPath.toLowerCase().includes(query))
})

const paginatedMediaFiles = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE
  return filteredMediaFiles.value.slice(start, start + ITEMS_PER_PAGE)
})

const paginationTotal = computed(() => Math.max(filteredMediaFiles.value.length, 1))

const totalPages = computed(() => Math.ceil(filteredMediaFiles.value.length / ITEMS_PER_PAGE))
watch(totalPages, (total) => {
  if (page.value > total && total > 0) {
    page.value = total
  }
})

const handleUpload = async () => {
  await context.switchFeature(StudioFeature.Media)
  emit('cancel')
}

const handleUseExternal = () => {
  emit('select', null)
}

const handleShowAllMedia = () => {
  selectedFolderFsPath.value = null
}

function isValidFileType(item: TreeItem) {
  if (props.type === 'image') {
    return isImageFile(item.fsPath)
  }
  if (props.type === 'video') {
    return isVideoFile(item.fsPath)
  }
  return false
}
</script>

<template>
  <UModal
    :open="open"
    :title="t(`studio.mediaPicker.${type}.title`)"
    :description="t(`studio.mediaPicker.${type}.description`)"
    :ui="{ content: 'max-w-5xl', body: 'flex flex-col gap-4' }"
    @update:open="(value: boolean) => !value && emit('cancel')"
  >
    <template #body>
      <div class="flex h-96 min-h-0 flex-col gap-4">
        <UInput
          ref="searchInput"
          v-model="search"
          color="neutral"
          variant="outline"
          size="xs"
          :placeholder="t('studio.mediaPicker.searchPlaceholder')"
          autofocus
          icon="i-lucide-search"
          class="w-full max-w-sm"
        />

        <div
          v-if="allMediaFiles.length === 0"
          class="py-4 text-center text-muted"
        >
          <UIcon
            :name="type === 'image' ? 'i-lucide-image-off' : 'i-lucide-video-off'"
            class="mx-auto mb-2 size-8"
          />
          <p class="text-sm">
            {{ t(`studio.mediaPicker.${type}.notAvailable`) }}
          </p>
        </div>

        <div
          v-else
          class="grid min-h-0 flex-1 lg:grid-cols-[200px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]"
        >
          <!-- Left header -->
          <div class="flex items-center justify-between gap-2 border-r border-default pr-4">
            <span class="text-xs font-medium uppercase tracking-wider">
              {{ t('studio.headings.directories') }}
            </span>

            <UButton
              color="neutral"
              :variant="selectedFolderFsPath ? 'outline' : 'soft'"
              icon="i-lucide-layout-grid"
              size="2xs"
              @click="handleShowAllMedia"
            >
              {{ t('studio.form.icon.allLibraries') }}
            </UButton>
          </div>

          <!-- Right header -->
          <div class="flex items-center justify-between gap-3 pl-4">
            <div class="flex min-w-0 items-center gap-1.5">
              <p class="shrink-0 text-xs font-medium uppercase tracking-wider">
                {{ t('studio.headings.media') }}
              </p>
              <span class="h-3 w-px shrink-0 bg-default" />
              <p class="truncate text-xs text-muted">
                {{ selectedFolderPath }}
              </p>
            </div>

            <UBadge
              :label="filteredMediaFiles.length.toString()"
              color="neutral"
              variant="soft"
              size="sm"
            />
          </div>

          <!-- Left content: tree -->
          <div class="overflow-y-auto border-r border-default pt-2 pr-4">
            <UTree
              v-model="selectedFolderTreeItem"
              :items="folderTreeItems"
              :get-key="(item: TreeItem) => item.fsPath"
              label-key="name"
              color="neutral"
              size="sm"
              class="min-w-0"
            />
          </div>

          <!-- Right content: media -->
          <div class="min-h-0 min-w-0 flex flex-col gap-4 pt-2 pl-4">
            <div
              v-if="filteredMediaFiles.length === 0"
              class="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-default px-6 text-center text-muted"
            >
              <UIcon
                :name="type === 'image' ? 'i-lucide-image-off' : 'i-lucide-video-off'"
                class="size-8"
              />

              <p class="mt-3 text-sm text-highlighted">
                {{ selectedFolderFsPath ? t(`studio.mediaPicker.${type}.notAvailableInFolder`, { fsPath: selectedFolderPath }) : t(`studio.mediaPicker.${type}.notAvailable`) }}
              </p>
            </div>

            <div
              v-else
              class="flex min-h-0 flex-1 flex-col gap-6"
            >
              <div class="grid flex-1 content-start grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                <UTooltip
                  v-for="media in paginatedMediaFiles"
                  :key="media.fsPath"
                  :text="media.fsPath"
                  :delay-duration="0"
                  arrow
                >
                  <button
                    type="button"
                    class="group relative aspect-square cursor-pointer rounded-lg"
                    @click="emit('select', media)"
                  >
                    <ImagePreview
                      v-if="type === 'image'"
                      :media="media"
                    />
                    <VideoPreview
                      v-else-if="type === 'video'"
                      :media="media"
                    />
                  </button>
                </UTooltip>
              </div>
            </div>
          </div>
        </div>

        <UPagination
          v-model:page="page"
          :total="paginationTotal"
          :items-per-page="ITEMS_PER_PAGE"
          :sibling-count="1"
          size="xs"
          show-edges
          class="ml-auto"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 ml-auto">
        <UButton
          variant="solid"
          icon="i-lucide-upload"
          @click="handleUpload"
        >
          {{ t(`studio.mediaPicker.${type}.upload`) }}
        </UButton>

        <UButton
          variant="outline"
          icon="i-lucide-link"
          @click="handleUseExternal"
        >
          {{ t(`studio.mediaPicker.${type}.useExternal`) }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
