<script setup lang="ts">
import { titleCase } from 'scule'
import type { FormTree, FormItem } from '../../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
  children: {
    type: Object as PropType<FormTree>,
    default: null,
  },
  level: {
    type: Number,
    default: 1,
  },
})

const model = defineModel({
  type: Object as PropType<Record<string, unknown>>,
  default: (): Record<string, unknown> => ({}),
})

// Increment level for nested items
const childLevel = computed(() => props.level + 1)

const entries = computed(() => {
  if (!props.children) return []

  return Object.entries(props.children)
    .filter(([_, child]) => !child.hidden)
    .map(([key, child]) => {
      const value = model.value?.[key] ?? child.default ?? getDefault(child.type)

      return {
        key,
        label: titleCase(child.title || key),
        value,
        formItem: child,
      }
    })
})

function updateValue(key: string, value: unknown) {
  model.value = { ...model.value, [key]: value }
}

function getDefault(type: string) {
  switch (type) {
    case 'array':
      return []
    case 'object':
      return {}
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <template v-if="entries.length">
      <UFormField
        v-for="entry in entries"
        :key="entry.key"
        :name="entry.key"
        :label="entry.label"
        :ui="{
          label: 'text-xs font-medium tracking-tight',
        }"
      >
        <InputWrapper
          :model-value="entry.value"
          :form-item="entry.formItem"
          :level="childLevel"
          @update:model-value="updateValue(entry.key, $event)"
        />
      </UFormField>
    </template>

    <div
      v-else
      class="flex flex-col items-center justify-center py-6 rounded-md border border-dashed border-muted"
    >
      <UIcon
        name="i-lucide-box"
        class="size-5 text-muted mb-2"
      />
      <p class="text-xs text-muted">
        {{ $t('studio.form.object.noProperties') }}
      </p>
    </div>
  </div>
</template>
