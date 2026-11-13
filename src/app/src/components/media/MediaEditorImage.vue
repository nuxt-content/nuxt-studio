<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { MediaItem, GitFile } from '../../types'
import type { PropType } from 'vue'
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

const imageRef = ref<HTMLImageElement | null>(null)
const imageDimensions = ref({ width: 0, height: 0 })

onMounted(() => {
  if (imageRef.value) {
    imageRef.value.onload = () => {
      imageDimensions.value = {
        width: imageRef.value?.naturalWidth || 0,
        height: imageRef.value?.naturalHeight || 0,
      }
    }
  }
})

const imageInfo = computed(() => [
  { label: t('studio.media.metaWidth'), value: `${imageDimensions.value.width}px` },
  { label: t('studio.media.metaHeight'), value: `${imageDimensions.value.height}px` },
])

const previewBackground = computed(() => {
  return {
    backgroundImage: `linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5), linear-gradient(45deg, #e5e5e5 25%, transparent 25%, transparent 75%, #e5e5e5 75%, #e5e5e5)`,
    backgroundSize: '16px 16px',
    backgroundPosition: '0 0, 8px 8px',
    backgroundColor: '#f5f5f5',
  }
})

const markdownCode = computed(() => {
  const name = props.remoteFile?.name || 'image'
  return `![${name}](${props.mediaItem.path})`
})
</script>

<template>
  <MediaEditorDetails
    :media-item="mediaItem"
    :remote-file="remoteFile"
    :metadata="imageInfo"
    :markdown="markdownCode"
  >
    <template #preview>
      <div
        class="flex items-center justify-center rounded-lg border border-default overflow-hidden max-h-[350px]"
        :style="previewBackground"
      >
        <img
          ref="imageRef"
          :src="mediaItem.path"
          :alt="$t('studio.media.altImagePreview')"
          class="max-w-full max-h-full object-contain"
        >
      </div>
    </template>
  </MediaEditorDetails>
</template>
