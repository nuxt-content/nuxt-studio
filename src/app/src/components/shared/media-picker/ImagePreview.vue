<script setup lang="ts">
import { computed } from 'vue'
import { Image } from '@unpic/vue'
import { getMediaThumbnailUrl } from '../../../utils/media'
import type { TreeItem } from '../../../types'

const props = defineProps<{ media: TreeItem }>()

const thumbnailSrc = computed(() =>
  getMediaThumbnailUrl(props.media.routePath || props.media.fsPath),
)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-lg border border-default hover:border-muted hover:ring-1 hover:ring-muted transition-all"
  >
    <Image
      :src="thumbnailSrc"
      width="200"
      height="200"
      layout="fixed"
      :alt="media.name"
      class="object-cover aspect-square"
    />
  </div>
</template>
