<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { DraftItem } from '../../types'
import { isImageFile, isVideoFile, isAudioFile } from '../../utils/file'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const isImage = computed(() => isImageFile(props.draftItem.modified?.path || ''))
const isVideo = computed(() => isVideoFile(props.draftItem.modified?.path || ''))
const isAudio = computed(() => isAudioFile(props.draftItem.modified?.path || ''))
</script>

<template>
  <div class="bg-neutral-800">
    <img
      v-if="isImage"
      :src="draftItem.modified!.path!"
    >
    <MediaVideoEditor
      v-else-if="isVideo"
      :src="draftItem.modified!.path!"
    />
    <MediaAudioEditor
      v-else-if="isAudio"
      :src="draftItem.modified!.path!"
    />
    <div v-else>
      <UIcon
        name="i-lucide-file"
        class="w-10 h-10"
      />
    </div>
  </div>
</template>
