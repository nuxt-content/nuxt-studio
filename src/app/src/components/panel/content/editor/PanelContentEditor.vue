<script setup lang="ts">
import { computed, type PropType, toRaw } from 'vue'
import { decompressTree } from '@nuxt/content/runtime'
import type { MarkdownRoot } from '@nuxt/content'
import type { DatabasePageItem, DraftFileItem } from '../../../../types'
import { useStudio } from '../../../../composables/useStudio'

const props = defineProps({
  draftItem: {
    type: Object as PropType<DraftFileItem>,
    required: true,
  },
})

const { draftFiles } = useStudio()

const document = computed<DatabasePageItem>({
  get() {
    if (!props.draftItem) {
      return {} as DatabasePageItem
    }

    const dbItem = props.draftItem.document as DatabasePageItem

    let result: DatabasePageItem
    // TODO: check mdcRoot and markdownRoot types with Ahad
    if (dbItem.body?.type === 'minimark') {
      result = {
        ...props.draftItem.document as DatabasePageItem,
        body: decompressTree(dbItem.body) as unknown as MarkdownRoot,
      }
    }
    else {
      result = dbItem
    }

    return result
  },
  set(value) {
    draftFiles.update(props.draftItem.id, {
      ...toRaw(document.value as DatabasePageItem),
      ...toRaw(value),
    })
  },
})
</script>

<template>
  <div class="h-full">
    <PanelContentEditorCode
      v-model="document"
      :draft-item="draftItem"
    />
  </div>
  <!-- <MDCEditorAST v-model="document" /> -->
</template>
