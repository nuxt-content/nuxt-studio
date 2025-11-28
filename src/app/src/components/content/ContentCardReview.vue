<script setup lang="ts">
import type { DraftItem, DatabaseItem, DatabasePageItem } from '../../types'
import type { PropType } from 'vue'
import { ref, computed, nextTick, watch } from 'vue'
import { DraftStatus, ContentFileExtension } from '../../types'
import { getFileExtension } from '../../utils/file'
import { useMonacoDiff } from '../../composables/useMonacoDiff'
import { useMonaco } from '../../composables/useMonaco'
import { useStudio } from '../../composables/useStudio'
import { fromBase64ToUTF8 } from '../../utils/string'
import { areContentEqual } from '../../utils/content'

const { ui, host } = useStudio()

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const diffEditorRef = ref<HTMLDivElement>()
const editorRef = ref<HTMLDivElement>()
const isLoadingContent = ref(false)
const isOpen = ref(false)
const isAutomaticFormattingDetected = ref(false)

const language = computed(() => {
  const ext = getFileExtension(props.draftItem.fsPath)
  switch (ext) {
    case ContentFileExtension.Markdown:
      return 'markdown'
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML:
      return 'yaml'
    case ContentFileExtension.JSON:
      return 'json'
    default:
      return 'plaintext'
  }
})

watch(isOpen, () => {
  if (isOpen.value && !isLoadingContent.value) {
    initializeEditor()
  }
})

async function initializeEditor() {
  isLoadingContent.value = true

  const generateContentFromDocument = host.document.generate.contentFromDocument
  const localOriginal = props.draftItem.original ? await generateContentFromDocument(props.draftItem.original as DatabaseItem) : null
  const remoteOriginal = props.draftItem.remoteFile?.content
    ? (props.draftItem.remoteFile.encoding === 'base64'
        ? fromBase64ToUTF8(props.draftItem.remoteFile.content)
        : props.draftItem.remoteFile.content)
    : null
  const modified = props.draftItem.modified ? await generateContentFromDocument(props.draftItem.modified as DatabasePageItem) : null

  isAutomaticFormattingDetected.value = !areContentEqual(localOriginal, remoteOriginal)

  // Wait for DOM to update before initializing Monaco
  await nextTick()

  if (props.draftItem.status === DraftStatus.Updated) {
    useMonacoDiff(diffEditorRef, {
      original: remoteOriginal!,
      modified: modified!,
      language: language.value,
      colorMode: ui.colorMode,
      editorOptions: {
        hideUnchangedRegions: {
          enabled: true,
        },
      },
    })
  }
  else if ([DraftStatus.Created, DraftStatus.Deleted].includes(props.draftItem.status)) {
    useMonaco(editorRef, {
      language,
      initialContent: modified! || remoteOriginal!,
      readOnly: true,
      colorMode: ui.colorMode,
    })
  }

  isLoadingContent.value = false
}
</script>

<template>
  <ItemCardReview
    v-model="isOpen"
    :draft-item="draftItem"
  >
    <template #open>
      <ResizableElement
        :min-height="200"
        :max-height="600"
        :initial-height="200"
        class="bg-elevated"
      >
        <div
          v-if="isLoadingContent"
          class="p-4 flex items-center justify-center h-full"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="w-5 h-5 animate-spin text-muted"
          />
        </div>
        <div
          v-else-if="draftItem.status === DraftStatus.Created || draftItem.status === DraftStatus.Deleted"
          ref="editorRef"
          class="w-full h-full"
        />
        <div
          v-else
          class="relative w-full h-full"
        >
          <MDCFormattingBanner v-if="isAutomaticFormattingDetected" />
          <div
            ref="diffEditorRef"
            class="w-full h-full"
          />
        </div>
      </ResizableElement>
    </template>
  </ItemCardReview>
</template>
