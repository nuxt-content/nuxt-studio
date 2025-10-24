<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { MediaItem, DraftStatus, GithubFile } from '../../types'
import { isImageFile, isVideoFile, isAudioFile } from '../../utils/file'

const props = defineProps({
  mediaItem: {
    type: Object as PropType<MediaItem>,
    required: true,
  },
  githubFile: {
    type: Object as PropType<GithubFile>,
    default: null,
  },
  status: {
    type: String as PropType<DraftStatus>,
    required: true,
  },
})

const isImage = computed(() => isImageFile(props.mediaItem?.path || ''))
const isVideo = computed(() => isVideoFile(props.mediaItem?.path || ''))
const isAudio = computed(() => isAudioFile(props.mediaItem?.path || ''))
</script>

<template>
  <div class="bg-elevated h-full">
    <MediaImageEditor
      v-if="isImage"
      :media-item="mediaItem"
      :github-file="githubFile"
    />
    <MediaVideoEditor
      v-else-if="isVideo"
      :src="mediaItem.path!"
    />
    <MediaAudioEditor
      v-else-if="isAudio"
      :src="mediaItem.path!"
    />
    <div v-else>
      <UIcon
        name="i-lucide-file"
        class="w-10 h-10"
      />
    </div>
  </div>
</template>
