<script setup lang="ts">
import type { FormItem } from '../../../types'
import type { PropType } from 'vue'

defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string | number>({ default: '' })
</script>

<template>
  <UTextarea
    v-model="model"
    :placeholder="$t('studio.form.text.placeholder')"
    :rows="4"
    autoresize
    size="xs"
    class="w-full"
  />
</template>
