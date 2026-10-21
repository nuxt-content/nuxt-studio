<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import type { MediaItem, GitFile } from '../../types'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  mediaItem: {
    type: Object as PropType<MediaItem>,
    required: true,
  },
  remoteFile: {
    type: Object as PropType<GitFile>,
    default: null,
  },
})

const { t } = useI18n()

const videoRef = ref<HTMLVideoElement | null>(null)
const videoDimensions = ref({ width: 0, height: 0 })
const duration = ref(0)

onMounted(() => {
  if (videoRef.value) {
    videoRef.value.onloadedmetadata = () => {
      videoDimensions.value = {
        width: videoRef.value?.videoWidth || 0,
        height: videoRef.value?.videoHeight || 0,
      }
      duration.value = videoRef.value?.duration || 0
    }
  }
})

const formattedDuration = computed(() => {
  if (!duration.value) {
    return '0s'
  }
  const totalSeconds = Math.round(duration.value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) {
    return `${seconds}s`
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`
})

const videoInfo = computed(() => [
  { label: t('studio.media.metaWidth'), value: `${videoDimensions.value.width}px` },
  { label: t('studio.media.metaHeight'), value: `${videoDimensions.value.height}px` },
  { label: 'Duration', value: formattedDuration.value },
])

const markdownCode = computed(() => {
  return `<video src="${props.mediaItem.path}" controls />`
})
</script>

<template>
  <MediaEditorDetails
    :media-item="mediaItem"
    :remote-file="remoteFile"
    :metadata="videoInfo"
    :markdown="markdownCode"
  >
    <template #preview>
      <div class="flex items-center justify-center rounded-lg border border-default overflow-hidden max-h-[350px] bg-black">
        <video
          ref="videoRef"
          :src="mediaItem.path"
          class="max-w-full max-h-full"
          controls
        >
          {{ $t('studio.media.videoTagNotSupported') }}
        </video>
      </div>
    </template>
  </MediaEditorDetails>
</template>
