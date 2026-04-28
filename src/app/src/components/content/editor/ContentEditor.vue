<script setup lang="ts">
import { computed, ref, watch, type PropType } from 'vue'
import { decompressTree } from '@nuxt/content/runtime'
import type { MarkdownRoot } from '@nuxt/content'
import { DraftStatus, type DatabasePageItem, type DraftItem } from '../../../types'
import { useStudio } from '../../../composables/useStudio'
import { useStudioState } from '../../../composables/useStudioState'
import { ContentFileExtension } from '../../../types'
import { shouldShowMarkdownFormattingBanner } from '../../../utils/draft'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftItem>,
    required: true,
  },
  readOnly: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const { context } = useStudio()
const { preferences } = useStudioState()

const showAutomaticFormattingDiff = ref(false)
const formattingChange = computed(() => shouldShowMarkdownFormattingBanner(props.draftItem) ? props.draftItem.formatting : undefined)

const document = computed<DatabasePageItem>({
  get() {
    if (!props.draftItem) {
      return {} as DatabasePageItem
    }

    if (props.draftItem.status === DraftStatus.Deleted) {
      return props.draftItem.original as DatabasePageItem
    }

    const dbItem = props.draftItem.modified as DatabasePageItem

    let result: DatabasePageItem
    if (dbItem.body?.type === 'minimark') {
      result = {
        ...props.draftItem.modified as DatabasePageItem,
        // @ts-expect-error todo fix MarkdownRoot/MDCRoot conversion in MDC module
        body: decompressTree(dbItem.body) as MarkdownRoot,
      }
    }
    else {
      result = dbItem
    }

    return result
  },
  set(value) {
    if (props.readOnly) {
      return
    }

    context.activeTree.value.draft.update(props.draftItem.fsPath, value)
  },
})

watch(() => props.draftItem.fsPath, () => {
  showAutomaticFormattingDiff.value = false
}, { immediate: true })

const language = computed(() => {
  switch (document.value?.extension) {
    case ContentFileExtension.Markdown:
      return 'mdc'
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML:
      return 'yaml'
    case ContentFileExtension.JSON:
      return 'javascript'
    default:
      return 'text'
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <ContentEditorConflict
      v-if="draftItem.conflict"
      :draft-item="draftItem"
    />
    <template v-else>
      <MDCFormattingBanner
        v-if="formattingChange"
        show-action
        :shown="showAutomaticFormattingDiff"
        class="flex-none"
        @show-diff="(show: boolean) => showAutomaticFormattingDiff = show"
      />
      <ContentEditorDiff
        v-if="showAutomaticFormattingDiff"
        :language="language"
        :original-content="formattingChange?.originalContent || ''"
        :formatted-content="formattingChange?.formattedContent || ''"
        class="flex-1"
      />
      <template v-else>
        <ContentEditorCode
          v-if="preferences.editorMode === 'code'"
          v-model="document"
          :draft-item="draftItem"
          :read-only="readOnly"
          class="flex-1"
        />
        <template v-else>
          <ContentEditorTipTap
            v-if="document.extension === ContentFileExtension.Markdown"
            v-model="document"
            :draft-item="draftItem"
            class="flex-1"
          />
          <ContentEditorForm
            v-else
            v-model="document"
            :draft-item="draftItem"
            class="flex-1"
          />
        </template>
      </template>
    </template>
  </div>
</template>
