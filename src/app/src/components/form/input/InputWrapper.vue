<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'
import type { FormItem } from '../../../types'
import { typeComponentMap } from '../../../utils/form'
import InputText from './InputText.vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
  },
})

const model = defineModel<unknown>({ required: true })

// Get the appropriate input component
const inputComponent = computed(() => typeComponentMap[props.formItem.type] ?? InputText)
</script>

<template>
  <InputObject
    v-if="formItem.type === 'object'"
    v-model="(model as Record<string, unknown>)"
    :form-item="formItem"
    :children="formItem.children || {}"
    :depth="depth"
  />

  <InputArray
    v-else-if="formItem.type === 'array'"
    v-model="(model as unknown[])"
    :form-item="formItem.arrayItemForm"
    :depth="depth"
  />

  <component
    :is="inputComponent"
    v-else
    v-model="model"
    :form-item="formItem"
  />
</template>
