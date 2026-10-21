<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { PropType } from 'vue'
import { formatBytes, getFileExtension, getFileIcon } from '../../utils/file'
import { fetchMediaFileSize, getMediaFileName, getMediaMarkdownLink } from '../../utils/media'
import type { MediaItem, GitFile } from '../../types'
import { useStudio } from '../../composables/useStudio'
import { joinURL } from 'ufo'
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
  /** Metadata listed before the type and size (dimensions, duration). */
  metadata: {
    type: Array as PropType<{ label: string, value: string }[]>,
    default: () => [],
  },
  /** Markdown to copy; a link to the file by default. */
  markdown: {
    type: String,
    default: '',
  },
})

const { gitProvider } = useStudio()
const { t } = useI18n()

// Files that are not in the repository have no remote size: ask the website.
const servedSize = ref<number | null>(null)

onMounted(async () => {
  if (!props.remoteFile && props.mediaItem.path) {
    servedSize.value = await fetchMediaFileSize(props.mediaItem.path)
  }
})

const fileExtension = computed(() => getFileExtension(props.mediaItem.path || '').toUpperCase())
const fileIcon = computed(() => getFileIcon(props.mediaItem.path || ''))
const fileName = computed(() => getMediaFileName(props.mediaItem, props.remoteFile))

const fileInfo = computed(() => {
  const info = [
    ...props.metadata,
    { label: t('studio.media.metaType'), value: fileExtension.value },
  ]

  const size = props.remoteFile?.size ?? servedSize.value
  if (size !== null) {
    info.push({ label: t('studio.media.metaSize'), value: formatBytes(size) })
  }

  return info
})

const markdownCode = computed(() => props.markdown || getMediaMarkdownLink(fileName.value, props.mediaItem.path!))

const remotePath = computed(() => {
  if (!props.remoteFile?.path) {
    return ''
  }
  return joinURL(gitProvider.api.getBranchUrl(), props.remoteFile.path)
})
</script>

<template>
  <div class="flex flex-col h-full gap-4 p-4">
    <slot name="preview">
      <div class="flex items-center justify-center rounded-lg border border-default bg-default py-10">
        <UIcon
          :name="fileIcon"
          class="w-12 h-12 text-muted"
        />
      </div>
    </slot>

    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="info in fileInfo"
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

    <div class="p-3 rounded-lg bg-default border border-muted">
      <div class="flex items-center gap-1 text-xs text-muted mb-2">
        <UIcon
          name="i-lucide-file"
          class="w-3.5 h-3.5"
        />
        <span>{{ $t('studio.media.fileName') }}</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ fileName }}
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
        <span>{{ $t('studio.media.publicPath') }}</span>
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
          :name="gitProvider.icon"
          class="w-3.5 h-3.5"
        />
        <span>{{ $t('studio.media.providerPath', { providerName: gitProvider.name }) }}</span>
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
        <span>{{ $t('studio.media.markdown') }}</span>
      </div>
      <p class="text-xs font-mono text-highlighted truncate">
        {{ markdownCode }}
      </p>
    </div>
  </div>
</template>
