<script setup lang="ts">
import type { FormItem, DatabaseItem } from '../../../types'
import type { PropType } from 'vue'
import { ref, computed, onMounted } from 'vue'
import { useStudio } from '../../../composables/useStudio'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string | string[]>()

const { host } = useStudio()

const items = ref<Array<{ label: string, value: string }>>([])
const isLoading = ref(true)

function referenceValue(item: DatabaseItem): string {
  const field = props.formItem.field ?? 'path'
  const value = item[field] ?? item.stem
  return String(value)
}

onMounted(async () => {
  try {
    const documents = await host.document.db.list()
    items.value = documents
      .filter(item => item.fsPath && host.collection.getByFsPath(item.fsPath)?.name === props.formItem.collection)
      .map(item => ({
        label: (item.title as string) || item.stem,
        value: referenceValue(item),
      }))
  }
  finally {
    isLoading.value = false
  }
})

const selectModel = computed({
  get: () => {
    if (props.formItem.multiple) {
      return Array.isArray(model.value) ? model.value : []
    }
    return typeof model.value === 'string' ? model.value : undefined
  },
  set: (value: string | string[] | undefined) => {
    model.value = value
  },
})
</script>

<template>
  <USelectMenu
    v-model="selectModel"
    :items="items"
    value-key="value"
    label-key="label"
    :multiple="formItem.multiple"
    :loading="isLoading"
    :search-input="{ placeholder: $t('studio.form.reference.searchPlaceholder') }"
    :placeholder="$t('studio.form.reference.placeholder')"
    size="xs"
    class="w-full"
    :ui="{ content: 'z-[1000]' }"
  >
    <template #empty>
      {{ $t('studio.form.reference.emptyCollection', { collection: formItem.collection }) }}
    </template>
  </USelectMenu>
</template>
