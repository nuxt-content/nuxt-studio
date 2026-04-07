<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStudio } from '../../composables/useStudio'
import { isImageFile, isVideoFile } from '../../utils/file'
import type { TreeItem as StudioTreeItem } from '../../types'
import { StudioFeature } from '../../types'
import ImagePreview from './media-picker/ImagePreview.vue'
import VideoPreview from './media-picker/VideoPreview.vue'

const ITEMS_PER_PAGE = 12

interface MediaFolderTreeItem {
  label: string
  fsPath: string
  defaultExpanded?: boolean
  children?: MediaFolderTreeItem[]
}

const { mediaTree, context } = useStudio()
const { t } = useI18n()

const props = defineProps<{ open: boolean, type: 'image' | 'video' }>()

const emit = defineEmits<{
  select: [image: StudioTreeItem | null]
  cancel: []
}>()

const searchRef = useTemplateRef<{ $el: HTMLElement }>('searchInput')
const search = ref('')
const page = ref(1)
const selectedFolderFsPath = ref<string | null>(null)

watch(search, async () => {
  page.value = 1
  await nextTick()
  searchRef.value?.$el.querySelector('input')?.focus()
})

watch(selectedFolderFsPath, () => {
  page.value = 1
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    selectedFolderFsPath.value = null
  }
})

const isValidFileType = (item: StudioTreeItem) => {
  if (props.type === 'image') {
    return isImageFile(item.fsPath)
  }
  if (props.type === 'video') {
    return isVideoFile(item.fsPath)
  }
  return false
}

function buildFolderTreeItem(item: StudioTreeItem, depth: number = 0): MediaFolderTreeItem {
  const directories = (item.children || []).filter(child => child.type === 'directory')

  return {
    label: item.name,
    fsPath: item.fsPath,
    defaultExpanded: depth < 2,
    children: directories.length > 0
      ? directories.map(child => buildFolderTreeItem(child, depth + 1))
      : undefined,
  }
}

function findFolderTreeItem(items: MediaFolderTreeItem[], fsPath: string): MediaFolderTreeItem | undefined {
  for (const item of items) {
    if (item.fsPath === fsPath) {
      return item
    }

    if (!item.children?.length) {
      continue
    }

    const matchingChild = findFolderTreeItem(item.children, fsPath)
    if (matchingChild) {
      return matchingChild
    }
  }
}

function findDirectoryItem(item: StudioTreeItem, fsPath: string): StudioTreeItem | undefined {
  if (item.type !== 'file' && item.fsPath === fsPath) {
    return item
  }

  for (const child of item.children || []) {
    if (child.type === 'file') {
      continue
    }

    const matchingChild = findDirectoryItem(child, fsPath)
    if (matchingChild) {
      return matchingChild
    }
  }
}

function hasSelectableMedia(items: StudioTreeItem[]): boolean {
  for (const item of items) {
    if (item.type === 'file' && !item.fsPath.endsWith('.gitkeep') && isValidFileType(item)) {
      return true
    }

    if (item.children?.length && hasSelectableMedia(item.children)) {
      return true
    }
  }

  return false
}

const folderTreeItems = computed<MediaFolderTreeItem[]>(() => [
  buildFolderTreeItem(mediaTree.rootItem.value),
])

const selectedFolderTreeItem = computed<MediaFolderTreeItem | undefined>({
  get() {
    if (!selectedFolderFsPath.value) {
      return undefined
    }

    return findFolderTreeItem(folderTreeItems.value, selectedFolderFsPath.value)
  },
  set(item) {
    if (!item?.fsPath) {
      return
    }

    selectedFolderFsPath.value = item.fsPath
  },
})

watch(folderTreeItems, (items) => {
  if (selectedFolderFsPath.value && !findFolderTreeItem(items, selectedFolderFsPath.value)) {
    selectedFolderFsPath.value = null
  }
}, { immediate: true })

const isFilteringByFolder = computed(() => selectedFolderFsPath.value !== null)

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
    return selectedFolder.value.name
  }

  return `${mediaTree.rootItem.value.name}/${selectedFolder.value.fsPath}`
})

const hasAnyMediaFiles = computed(() => {
  return hasSelectableMedia(mediaTree.root.value)
})

const allMediaFiles = computed<StudioTreeItem[]>(() => {
  const medias: StudioTreeItem[] = []

  const collectMedias = (items: StudioTreeItem[]) => {
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

const mediaFiles = computed<StudioTreeItem[]>(() => {
  if (!selectedFolder.value) {
    return allMediaFiles.value
  }

  return (selectedFolder.value.children || []).filter((item): item is StudioTreeItem => {
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

const totalPages = computed(() => Math.ceil(filteredMediaFiles.value.length / ITEMS_PER_PAGE))
const paginationTotal = computed(() => Math.max(filteredMediaFiles.value.length, 1))
const getFolderTreeItemKey = (item: MediaFolderTreeItem) => item.fsPath

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
          size="lg"
          :placeholder="t('studio.mediaPicker.searchPlaceholder')"
          autofocus
          icon="i-lucide-search"
          class="w-full max-w-sm"
        />

        <div
          v-if="!hasAnyMediaFiles"
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
          class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[240px_minmax(0,1fr)]"
        >
          <div class="rounded-lg border border-default bg-muted/20 p-3 max-h-104 overflow-y-auto">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span class="text-xs uppercase tracking-wider text-muted">
                {{ t('studio.headings.directories') }}
              </span>

              <UButton
                color="neutral"
                :variant="isFilteringByFolder ? 'outline' : 'soft'"
                icon="i-lucide-layout-grid"
                size="xs"
                @click="handleShowAllMedia"
              >
                {{ t('studio.form.icon.allLibraries') }}
              </UButton>
            </div>

            <UTree
              v-model="selectedFolderTreeItem"
              :items="folderTreeItems"
              :get-key="getFolderTreeItemKey"
              color="neutral"
              size="sm"
              class="min-w-0"
            />
          </div>

          <div class="min-w-0 min-h-0 flex flex-col gap-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs uppercase tracking-wider text-muted">
                  {{ t('studio.headings.media') }}
                </p>
                <p class="truncate text-sm text-highlighted">
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

            <div
              v-if="filteredMediaFiles.length === 0"
              class="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-default px-6 text-center text-muted"
            >
              <UIcon
                :name="type === 'image' ? 'i-lucide-image-off' : 'i-lucide-video-off'"
                class="size-8"
              />

              <p class="mt-3 text-sm text-highlighted">
                {{ isFilteringByFolder ? t(`studio.mediaPicker.${type}.notAvailableInFolder`, { fsPath: selectedFolderPath }) : t(`studio.mediaPicker.${type}.notAvailable`) }}
              </p>
            </div>

            <div
              v-else
              class="flex min-h-0 flex-1 flex-col gap-6"
            >
              <div class="grid flex-1 content-start grid-cols-3 gap-4 sm:grid-cols-4 xl:grid-cols-5">
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
          show-edges
          class="ml-auto"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2 ml-auto">
        <UButton
          color="neutral"
          variant="solid"
          icon="i-lucide-upload"
          size="lg"
          @click="handleUpload"
        >
          {{ t(`studio.mediaPicker.${type}.upload`) }}
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-link"
          size="lg"
          @click="handleUseExternal"
        >
          {{ t(`studio.mediaPicker.${type}.useExternal`) }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
