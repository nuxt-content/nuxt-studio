<script setup lang="ts">
import type { FormItem, TreeItem } from '../../../types'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'
import ModalMediaPicker from '../../shared/ModalMediaPicker.vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    default: () => ({}),
  },
})

const model = defineModel<string | number>({ default: '' })

const isMediaPickerOpen = ref(false)

const hasOptions = computed(() => props.formItem?.options && props.formItem.options.length > 0)

const selectItems = computed(() => {
  if (!props.formItem?.options) return []
  return props.formItem.options.map(option => ({
    label: option,
    value: option,
  }))
})

function handleMediaSelect(media: TreeItem) {
  model.value = media.routePath || media.fsPath
  isMediaPickerOpen.value = false
}

function handleMediaCancel() {
  isMediaPickerOpen.value = false
}
</script>

<template>
  <USelect
    v-if="hasOptions"
    v-model="(model as string)"
    :items="selectItems"
    :placeholder="$t('studio.form.text.selectPlaceholder')"
    size="xs"
    class="w-full"
  />
  <template v-else>
    <UInput
      v-model="model"
      :placeholder="$t('studio.form.text.placeholder')"
      size="xs"
      class="w-full"
    >
      <template #trailing>
        <UTooltip :text="$t('studio.mediaPicker.image.title')">
          <UButton
            size="xs"
            color="neutral"
            variant="none"
            icon="i-lucide-image"
            class="cursor-pointer opacity-50 hover:opacity-100"
            @click="isMediaPickerOpen = true"
          />
        </UTooltip>
      </template>
    </UInput>

    <ModalMediaPicker
      :open="isMediaPickerOpen"
      type="image"
      @select="handleMediaSelect"
      @cancel="handleMediaCancel"
    />
  </template>
</template>
