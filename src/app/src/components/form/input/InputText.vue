<script setup lang="ts">
import type { FormItem, TreeItem } from '../../../types'
import type { PropType } from 'vue'
import { computed, ref } from 'vue'

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
  return props.formItem.options
    .filter(option => option !== '')
    .map(option => ({
      label: option,
      value: option,
    }))
})

// Keywords that suggest the field expects a media/image path
const imageKeywords = ['image', 'img', 'src', 'cover', 'thumbnail', 'avatar', 'photo', 'picture', 'banner', 'logo', 'poster']

// Keywords that suggest the field expects an icon
const iconKeywords = ['icon']

// Determine if this is a video property based on the component context
const isVideoProp = computed(() => {
  const id = props.formItem?.id?.toLowerCase() || ''
  const key = props.formItem?.key?.toLowerCase() || ''

  // Check if this is the 'src' field of a video component
  return (key === 'src' && id.includes('video'))
})

const isImageProp = computed(() => {
  // If it's a video prop, don't treat it as image
  if (isVideoProp.value) return false

  const id = props.formItem?.id?.split('/').pop()?.toLowerCase() || ''
  const key = props.formItem?.key?.toLowerCase() || ''
  const title = props.formItem?.title?.toLowerCase() || ''

  return imageKeywords.some(keyword =>
    id.includes(keyword) || key.includes(keyword) || title.includes(keyword),
  )
})

const isMediaProp = computed(() => isImageProp.value || isVideoProp.value)

const mediaType = computed(() => isVideoProp.value ? 'video' : 'image')

const isIconProp = computed(() => {
  const id = props.formItem?.id?.toLowerCase() || ''
  const key = props.formItem?.key?.toLowerCase() || ''
  const title = props.formItem?.title?.toLowerCase() || ''

  return iconKeywords.some(keyword =>
    id.includes(keyword) || key.includes(keyword) || title.includes(keyword),
  )
})

function handleMediaSelect(media: TreeItem | null) {
  // If null, leave field empty for manual entry
  model.value = media?.routePath || media?.fsPath || ''
  isMediaPickerOpen.value = false
}

function handleMediaCancel() {
  isMediaPickerOpen.value = false
}
</script>

<template>
  <!-- Select for options -->
  <USelect
    v-if="hasOptions"
    v-model="(model as string)"
    :items="selectItems"
    :placeholder="$t('studio.form.text.selectPlaceholder')"
    size="xs"
    class="w-full"
  />

  <!-- Icon input -->
  <InputIcon
    v-else-if="isIconProp"
    v-model="(model as string)"
    :form-item="formItem"
    class="w-full"
  />

  <!-- Text input with optional media picker -->
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
        <UTooltip :text="$t(`studio.mediaPicker.${mediaType}.title`)">
          <UButton
            size="xs"
            color="neutral"
            variant="none"
            :icon="mediaType === 'video' ? 'i-lucide-video' : 'i-lucide-image'"
            class="cursor-pointer opacity-50 hover:opacity-100"
            @click="isMediaPickerOpen = true"
          />
        </UTooltip>
      </template>
    </UInput>

    <ModalMediaPicker
      v-if="isMediaProp"
      :open="isMediaPickerOpen"
      :type="mediaType"
      @select="handleMediaSelect"
      @cancel="handleMediaCancel"
    />
  </template>
</template>
