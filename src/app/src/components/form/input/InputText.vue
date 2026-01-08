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

// Keywords that suggest the field expects a media/image path
const mediaKeywords = ['image', 'img', 'src', 'cover', 'thumbnail', 'avatar', 'photo', 'picture', 'banner', 'logo', 'icon', 'poster']

const isMediaProp = computed(() => {
  const id = props.formItem?.id?.toLowerCase() || ''
  const key = props.formItem?.key?.toLowerCase() || ''
  const title = props.formItem?.title?.toLowerCase() || ''

  return mediaKeywords.some(keyword =>
    id.includes(keyword) || key.includes(keyword) || title.includes(keyword),
  )
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
      <template
        v-if="isMediaProp"
        #trailing
      >
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
      v-if="isMediaProp"
      :open="isMediaPickerOpen"
      type="image"
      @select="handleMediaSelect"
      @cancel="handleMediaCancel"
    />
  </template>
</template>
