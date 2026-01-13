<script setup lang="ts">
import { titleCase } from 'scule'
import type { FormItem, FormTree } from '../../types'
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import { applyValueById } from '../../utils/form'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
})

const form = defineModel({ type: Object as PropType<FormTree>, default: () => ({}) })

const label = computed(() => titleCase(props.formItem.title))

// Initialize model value
const model = ref(computeValue(props.formItem))

// Sync changes back to parent form
watch(model, (newValue) => {
  if (newValue === props.formItem.value) {
    return
  }

  form.value = applyValueById(form.value, props.formItem.id, newValue)
}, { deep: true })

// Watch for external form item changes
watch(() => props.formItem, (newFormItem) => {
  model.value = computeValue(newFormItem)
}, { deep: true })

function computeValue(formItem: FormItem): unknown {
  const value = formItem.value

  switch (formItem.type) {
    case 'string':
    case 'date':
    case 'datetime':
    case 'icon':
    case 'media':
    case 'file':
    case 'textarea':
      return typeof value === 'string' ? value : ''
    case 'boolean':
      return typeof value === 'boolean' ? value : false
    case 'number':
      return typeof value === 'number' ? value : 0
    case 'array':
      return Array.isArray(value) ? value : []
    case 'object':
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    default:
      return value ?? null
  }
}
</script>

<template>
  <UFormField
    :name="formItem.id"
    :label="label"
    :ui="{
      root: 'w-full mt-2',
      label: 'text-xs font-semibold tracking-tight',
    }"
  >
    <InputWrapper
      v-model="model"
      :form-item="formItem"
      :level="1"
    />
  </UFormField>
</template>
