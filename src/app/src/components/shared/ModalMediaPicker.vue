<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useStudio } from '../../composables/useStudio'
import { isImageFile, isVideoFile } from '../../utils/file'
import type { TreeItem } from '../../types'
import { StudioFeature } from '../../types'
import ImagePreview from './media-picker/ImagePreview.vue'
import VideoPreview from './media-picker/VideoPreview.vue'

const ITEMS_PER_PAGE = 12

const { mediaTree, context } = useStudio()

const props = defineProps<{ open: boolean, type: 'image' | 'video' }>()

const emit = defineEmits<{
  select: [image: TreeItem | null]
  cancel: []
}>()

const search = ref('')
const page = ref(1)

// Nuxt UI `UModal` (Reka `DialogContent`) can move focus to its `DismissableLayer`
// container when this list re-renders, which blurs the search input.
// Debouncing reduces those re-renders and avoids triggering that focus shift on each keypress.
const debouncedSearch = refDebounced(search, 300)

watch(debouncedSearch, () => {
  page.value = 1
})

const isValidFileType = (item: TreeItem) => {
  if (props.type === 'image') {
    return isImageFile(item.fsPath)
  }
  if (props.type === 'video') {
    return isVideoFile(item.fsPath)
  }
  return false
}

const mediaFiles = computed<TreeItem[]>(() => {
  const medias: TreeItem[] = []

  const collectMedias = (items: TreeItem[]) => {
    for (const item of items) {
      if (item.type === 'file' && isValidFileType(item)) {
        medias.push(item)
      }
      if (item.children) {
        collectMedias(item.children)
      }
    }
  }

  collectMedias(mediaTree.root.value)

  return medias
})

const filteredMediaFiles = computed<TreeItem[]>(() => {
  const query = debouncedSearch.value.trim().toLowerCase()

  if (!query) {
    return mediaFiles.value
  }

  const files = mediaFiles.value.filter(file => file.fsPath.toLowerCase().includes(query))

  return files
})

const paginatedMediaFiles = computed<TreeItem[]>(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE
  return filteredMediaFiles.value.slice(start, start + ITEMS_PER_PAGE)
})

const totalPages = computed(() => Math.ceil(filteredMediaFiles.value.length / ITEMS_PER_PAGE))
const paginationTotal = computed(() => Math.max(filteredMediaFiles.value.length, 1))

watch(totalPages, (total) => {
  if (page.value > total && total > 0) {
    page.value = total
  }
})

const handleMediaSelect = (media: TreeItem) => {
  emit('select', media)
}

const handleUpload = async () => {
  emit('cancel')
  await context.switchFeature(StudioFeature.Media)
}

const handleUseExternal = () => {
  // Emit select with null to trigger manual URL entry
  emit('select', null)
}
</script>

<template>
  <UModal
    :open="open"
    :title="$t(`studio.mediaPicker.${type}.title`)"
    :description="$t(`studio.mediaPicker.${type}.description`)"
    :ui="{ content: 'max-w-4xl', body: 'flex flex-col gap-4' }"
    @update:open="(value: boolean) => !value && emit('cancel')"
  >
    <template #body>
      <div class="flex h-96 flex-col gap-4">
        <div class="flex-1 min-w-0 flex flex-col gap-4">
          <UInput
            v-model="search"
            variant="outline"
            size="lg"
            placeholder="Search by full path"
            icon="i-lucide-search"
            class="w-full max-w-sm"
          />

          <div
            v-if="mediaFiles.length === 0"
            class="text-center py-4 text-muted"
          >
            <UIcon
              :name="type === 'image' ? 'i-lucide-image-off' : 'i-lucide-video-off'"
              class="size-8 mx-auto mb-2"
            />
            <p class="text-sm">
              {{ $t(`studio.mediaPicker.${type}.notAvailable`) }}
            </p>
          </div>

          <div
            v-else
            class="flex min-h-0 flex-1 flex-col gap-6"
          >
            <div class="grid flex-1 content-start grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              <UTooltip
                v-for="media in paginatedMediaFiles"
                :key="media.fsPath"
                :text="media.fsPath"
                :delay-duration="0"
                arrow
              >
                <button
                  class="aspect-square rounded-lg cursor-pointer group relative"
                  @click="handleMediaSelect(media)"
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

            <div class="mt-auto flex justify-end">
              <UPagination
                v-model:page="page"
                :total="paginationTotal"
                :items-per-page="ITEMS_PER_PAGE"
                :sibling-count="1"
                show-edges
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex gap-2">
        <UButton
          variant="solid"
          icon="i-lucide-upload"
          @click="handleUpload"
        >
          {{ $t(`studio.mediaPicker.${type}.upload`) }}
        </UButton>

        <UButton
          variant="outline"
          icon="i-lucide-link"
          @click="handleUseExternal"
        >
          {{ $t(`studio.mediaPicker.${type}.useExternal`) }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
