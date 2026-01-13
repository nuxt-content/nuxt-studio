<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { FormItem } from '../../../types'
import { typeComponentMap } from '../../../utils/form'
import InputText from './InputText.vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
  level: {
    type: Number,
    required: true,
  },
})

const model = defineModel<unknown>({ required: true })

// Nested form state for arrays/objects displayed as overlays
const nestedFormOpen = ref(false)

// Determine if this is a complex type that needs overlay
const nestedForm = computed(() => {
  if (props.level <= 2) return false

  return props.formItem.type === 'array' || props.formItem.type === 'object'
})

// Get the appropriate input component
const inputComponent = computed(() => typeComponentMap[props.formItem.type] ?? InputText)

// Get display text for complex types
const displayText = computed(() => {
  if (props.formItem.type === 'array') {
    const count = Array.isArray(model.value) ? model.value.length : 0
    return { count, key: 'studio.tiptap.element.props.itemsCount' }
  }
  if (props.formItem.type === 'object') {
    const count = props.formItem.children ? Object.keys(props.formItem.children).length : 0
    return { count, key: 'studio.tiptap.element.props.fieldsCount' }
  }
  return null
})

function openNestedForm() {
  nestedFormOpen.value = true
}

function closeNestedForm() {
  nestedFormOpen.value = false
}
</script>

<template>
  <!-- Nested form overlay for arrays/objects -->
  <template v-if="nestedForm && nestedFormOpen">
    <div class="fixed inset-0 bg-default z-50 flex flex-col p-3 overflow-y-auto rounded-lg">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-mono font-semibold text-highlighted">
          {{ formItem.title }}
        </span>
        <UButton
          size="xs"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          aria-label="Close"
          @click="closeNestedForm"
        />
      </div>

      <InputArray
        v-if="formItem.type === 'array'"
        v-model="(model as unknown[])"
        class="flex-1"
        :form-item="formItem.arrayItemForm"
        :level="level"
      />

      <InputObject
        v-else-if="formItem.type === 'object'"
        v-model="(model as Record<string, unknown>)"
        class="flex-1"
        :form-item="formItem"
        :children="formItem.children || {}"
        :level="level"
      />
    </div>
  </template>

  <!-- Array/Object button -->
  <template v-else-if="nestedForm">
    <div class="flex items-center gap-2">
      <span
        v-if="displayText"
        class="text-xs text-muted"
      >
        {{ $t(displayText.key, { count: displayText.count }) }}
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="link"
        :label="$t('studio.tiptap.element.props.edit', { type: formItem.type })"
        @click="openNestedForm"
      />
    </div>
  </template>

  <!-- Primitive types -->
  <template v-else>
    <InputObject
      v-if="formItem.type === 'object'"
      v-model="(model as Record<string, unknown>)"
      :form-item="formItem"
      :children="formItem.children || {}"
      :level="level"
    />

    <InputArray
      v-else-if="formItem.type === 'array'"
      v-model="(model as unknown[])"
      :form-item="formItem.arrayItemForm"
      :level="level"
    />

    <component
      :is="inputComponent"
      v-else
      v-model="model"
      :form-item="formItem"
    />
  </template>
</template>
