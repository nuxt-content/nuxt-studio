<script lang="ts" setup>
import type { FormItem, FormTree } from '../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
})

const form = defineModel({ type: Object as PropType<FormTree>, default: () => ({}) })

const visibleChildren = computed(() => {
  if (!props.formItem.children) return []
  return Object.keys(props.formItem.children).filter(key => !props.formItem.children![key].hidden)
})
</script>

<template>
  <Collapsible
    v-if="formItem.children"
    :label="formItem.title"
    :default-open="true"
    class="w-full mt-3"
  >
    <template #badge>
      <UBadge
        v-if="visibleChildren.length > 0"
        variant="subtle"
        size="xs"
      >
        {{ $t('studio.form.section.propertyCount', visibleChildren.length) }}
      </UBadge>
    </template>

    <FormSection
      v-for="childKey in visibleChildren"
      :key="formItem.children[childKey].id"
      v-model="form"
      :form-item="formItem.children[childKey]"
    />
  </Collapsible>

  <FormInput
    v-else
    v-model="form"
    :form-item="formItem"
  />
</template>
