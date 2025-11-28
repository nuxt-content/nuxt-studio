<script setup lang="ts">
import type { TreeItem, StudioItemActionId } from '../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'
import { getFileIcon, CONTENT_EXTENSIONS } from '../../utils/file'
import { ContentFileExtension } from '../../types'

const props = defineProps({
  actionId: {
    type: String as PropType<StudioItemActionId.CreateDocument | StudioItemActionId.RenameItem>,
    required: true,
  },
  parentItem: {
    type: Object as PropType<TreeItem>,
    required: true,
  },
  renamedItem: {
    type: Object as PropType<TreeItem>,
    default: null,
  },
})

const fileIcon = computed(() => {
  if (props.renamedItem) {
    return getFileIcon(props.renamedItem.fsPath)
  }

  return 'i-simple-icons-markdown'
})
</script>

<template>
  <ItemCardForm
    :action-id="actionId"
    :parent-item="parentItem"
    :renamed-item="renamedItem"
    :config="{
      allowed: CONTENT_EXTENSIONS,
      default: ContentFileExtension.Markdown,
      editable: true,
    }"
  >
    <template #thumbnail>
      <div class="w-full h-full flex items-center justify-center">
        <UIcon
          :name="fileIcon"
          class="w-6 h-6 text-muted"
        />
      </div>
    </template>
  </ItemCardForm>
</template>
