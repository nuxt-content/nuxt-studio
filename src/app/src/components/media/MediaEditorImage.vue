<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { formatBytes, getFileExtension } from '../../utils/file'
import type { MediaItem, GitFile } from '../../types'
import type { PropType } from 'vue'
import { useStudio } from '../../composables/useStudio'
import { useGitProviderIcon } from '../../composables/useGitProviderIcon'
import { joinURL } from 'ufo'

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

const { git } = useStudio()
const { icon: gitProviderIcon, providerName } = useGitProviderIcon()

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

const fileExtension = computed(() => {
  return getFileExtension(props.mediaItem.path || '').toUpperCase()
})

const imageInfo = computed(() => {
  const info = [
    { label: 'Width', value: `${imageDimensions.value.width}px` },
    { label: 'Height', value: `${imageDimensions.value.height}px` },
    { label: 'Type', value: fileExtension.value },
  ]

  if (props.remoteFile) {
    info.push({ label: 'Size', value: formatBytes(props.remoteFile.size) })
  }

  return info
})

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

const remotePath = computed(() => {
  return joinURL(git.getBranchUrl(), props.remoteFile.path!)
})
</script>

<template>
  <div class="flex flex-col h-full gap-4 p-4">
    <div
      class="flex items-center justify-center rounded-lg border border-default overflow-hidden max-h-[350px]"
      :style="previewBackground"
    >
      <img
        ref="imageRef"
        :src="mediaItem.path"
        alt="Image preview"
        class="max-w-full max-h-full object-contain"
      >
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="info in imageInfo"
        :key="info.label"
        class="p-3 rounded-lg bg-default border border-muted"
      >
        <p class="text-xs text-muted mb-1">
          {{ info.label }}
        </p>
        <p class="text-sm font-semibold text-highlighted">
          {{ info.value }}
        </p>
      </div>
    </div>

    <div
      v-if="remoteFile?.name"
      class="p-3 rounded-lg bg-default border border-muted"
    >
      <div class="flex items-center gap-1 text-xs text-muted mb-2">
        <UIcon
          name="i-lucide-file"
          class="w-3.5 h-3.5"
        />
        <span>File name</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ remoteFile.name }}
      </p>
    </div>

    <div class="p-3 rounded-lg bg-default border border-muted relative">
      <div class="absolute top-3 right-3">
        <CopyButton :content="mediaItem.path!" />
      </div>
      <div class="flex items-center gap-1 text-xs text-muted mb-2">
        <UIcon
          name="i-lucide-globe"
          class="w-3.5 h-3.5"
        />
        <span>Public path</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ mediaItem.path }}
      </p>
    </div>

    <div
      v-if="remoteFile?.path"
      class="p-3 rounded-lg bg-default border border-muted relative"
    >
      <div class="absolute top-3 right-3">
        <CopyButton :content="remotePath" />
      </div>
      <div class="flex items-center gap-1 text-xs text-muted mb-2">
        <UIcon
          :name="gitProviderIcon"
          class="w-3.5 h-3.5"
        />
        <span>{{ providerName }} path</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ remoteFile.path }}
      </p>
    </div>

    <div class="p-3 rounded-lg bg-default border border-muted relative">
      <div class="absolute top-3 right-3">
        <CopyButton :content="markdownCode" />
      </div>
      <div class="flex items-center gap-1 text-xs text-muted mb-2">
        <UIcon
          name="i-simple-icons:markdown"
          class="w-3.5 h-3.5"
        />
        <span>Markdown</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ markdownCode }}
      </p>
    </div>
  </div>
</template>
