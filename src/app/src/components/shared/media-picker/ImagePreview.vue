<script setup lang="ts">
import { computed } from 'vue'
import { Image } from '@unpic/vue'
import { getMediaFullUrl, getMediaThumbnailUrl } from '../../../utils/media'
import type { TreeItem } from '../../../types'

const props = defineProps<{
  media: TreeItem
  /** When true, displays full-size image instead of thumbnail. */
  fullSize?: boolean
}>()

const emit = defineEmits<{
  loaded: [dimensions: { width: number, height: number }]
}>()

const imageSrc = computed(() => {
  const path = props.media.routePath || props.media.fsPath
  return props.fullSize ? getMediaFullUrl(path) : getMediaThumbnailUrl(path)
})

function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement
  if (img?.naturalWidth && img?.naturalHeight) {
    emit('loaded', { width: img.naturalWidth, height: img.naturalHeight })
  }
}
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-lg border border-default bg-elevated transition-all',
      !fullSize && 'hover:border-muted hover:ring-1 hover:ring-muted',
    ]"
  >
    <img
      v-if="fullSize"
      :src="imageSrc"
      :alt="media.name"
      class="object-contain w-full max-h-96"
      @load="handleImageLoad"
    >
    <Image
      v-else
      :src="imageSrc"
      width="200"
      height="200"
      layout="fixed"
      :alt="media.name"
      class="object-cover aspect-square"
    />
  </div>
</template>
