<script setup lang="ts">
import type { DraftItem, DatabasePageItem } from '../../types'
import type { PropType } from 'vue'
import { ref, computed, nextTick, watch } from 'vue'
import { DraftStatus, ContentFileExtension } from '../../types'
import { getFileExtension } from '../../utils/file'
import { decodeRemoteContent } from '../../utils/draft'
import { useMonaco } from '../../composables/useMonaco'
import { useStudio } from '../../composables/useStudio'

const { ui, host } = useStudio()

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
})

const editorRef = ref<HTMLDivElement>()
const isLoadingContent = ref(false)
const isOpen = ref(false)
const showAutomaticFormattingDiff = ref(false)
const originalContent = ref('')
const modifiedContent = ref('')

const language = computed(() => {
  const ext = getFileExtension(props.draftItem.fsPath)
  switch (ext) {
    case ContentFileExtension.Markdown: return 'mdc'
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML: return 'yaml'
    case ContentFileExtension.JSON: return 'javascript'
    default: return 'text'
  }
})

const hasAutomaticFormatting = computed(() => !!props.draftItem.formatting)

watch(isOpen, () => {
  if (isOpen.value && !isLoadingContent.value) initializeEditor()
})

async function initializeEditor() {
  isLoadingContent.value = true
  showAutomaticFormattingDiff.value = false

  const remoteOriginal = props.draftItem.formatting?.originalContent
    || (props.draftItem.remoteFile?.content ? decodeRemoteContent(props.draftItem.remoteFile) : null)
  const modified = props.draftItem.modified ? await host.document.generate.contentFromDocument(props.draftItem.modified as DatabasePageItem) : null
  originalContent.value = remoteOriginal || ''
  modifiedContent.value = modified || ''

  await nextTick()

  if ([DraftStatus.Created, DraftStatus.Deleted].includes(props.draftItem.status)) {
    useMonaco(editorRef, {
      language,
      initialContent: modifiedContent.value || originalContent.value,
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
    :formatting-badge-label="hasAutomaticFormatting ? $t('studio.review.formatting') : undefined"
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
          class="flex flex-col h-full"
        >
          <MDCFormattingBanner
            v-if="hasAutomaticFormatting"
            show-action
            :shown="showAutomaticFormattingDiff"
            @show-diff="(show: boolean) => showAutomaticFormattingDiff = show"
          />
          <ContentEditorDiff
            v-if="showAutomaticFormattingDiff"
            :language="language"
            :original-content="draftItem.formatting?.originalContent || ''"
            :formatted-content="draftItem.formatting?.formattedContent || ''"
            class="flex-1"
          />
          <ContentEditorDiff
            v-else
            :language="language"
            :original-content="originalContent"
            :formatted-content="modifiedContent"
            class="flex-1"
          />
        </div>
      </ResizableElement>
    </template>
  </ItemCardReview>
</template>
