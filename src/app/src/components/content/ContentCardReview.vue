<script setup lang="ts">
import type { DraftItem, DatabaseItem, DatabasePageItem } from '../../types'
import type { PropType } from 'vue'
import { ref, computed, nextTick, watch } from 'vue'
import { DraftStatus, ContentFileExtension } from '../../types'
import { getFileExtension } from '../../utils/file'
import { generateContentFromDocument } from '../../utils/content'
import { useMonacoDiff } from '../../composables/useMonacoDiff'
import { useMonaco } from '../../composables/useMonaco'
import { useStudio } from '../../composables/useStudio'

const { ui } = useStudio()

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

  const original = props.draftItem.original ? await generateContentFromDocument(props.draftItem.original as DatabaseItem) : null
  const modified = props.draftItem.modified ? await generateContentFromDocument(props.draftItem.modified as DatabasePageItem) : null

  // Wait for DOM to update before initializing Monaco
  await nextTick()

  if (props.draftItem.status === DraftStatus.Updated) {
    useMonacoDiff(diffEditorRef, {
      original: original!,
      modified: modified!,
      language: language.value,
      colorMode: ui.colorMode.value,
      editorOptions: {
        // hide unchanged regions
        hideUnchangedRegions: {
          enabled: true,
        },
      },
    })
  }
  else if ([DraftStatus.Created, DraftStatus.Deleted].includes(props.draftItem.status)) {
    useMonaco(editorRef, {
      language,
      initialContent: modified! || original!,
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
      <div class="bg-elevated h-[300px]">
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
          ref="diffEditorRef"
          class="w-full h-full"
        />
      </div>
    </template>
  </ItemCardReview>
</template>
