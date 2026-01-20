<script setup lang="ts">
import { computed, ref } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { useI18n } from 'vue-i18n'
import type { ComponentMeta } from '../../../types'
import TiptapComponentProps from '../TiptapComponentProps.vue'
import { sanitizeImageUrl } from '../../../utils/tiptap/props'

const nodeProps = defineProps(nodeViewProps)
const { t } = useI18n()

const isPopoverOpen = ref(false)

// Metadata for image node
const imageMeta = {
  name: 'Image',
  path: '',
  meta: {
    props: [
      {
        name: 'src',
        global: false,
        description: t('studio.tiptap.image.source'),
        tags: [],
        required: true,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'alt',
        global: false,
        description: t('studio.tiptap.image.alt_text'),
        tags: [],
        required: false,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'title',
        global: false,
        description: t('studio.tiptap.image.title'),
        tags: [],
        required: false,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'width',
        global: false,
        description: t('studio.tiptap.image.width'),
        tags: [],
        required: false,
        type: 'number',
        declarations: [],
        schema: { kind: 'enum', type: 'number', schema: [] },
      },
      {
        name: 'height',
        global: false,
        description: t('studio.tiptap.image.height'),
        tags: [],
        required: false,
        type: 'number',
        declarations: [],
        schema: { kind: 'enum', type: 'number', schema: [] },
      },
    ],
    slots: [],
    events: [],
  },
} as unknown as ComponentMeta

// Image attributes
const imageAttrs = computed(() => {
  const props = nodeProps.node.attrs.props || {}
  const src = props.src || ''
  return {
    src: sanitizeImageUrl(src) || '',
    alt: props.alt || '',
    title: props.title || '',
    width: props.width || '',
    height: props.height || '',
    class: props.class || '',
  }
})

// Update attributes from TiptapComponentProps
function updateImageAttributes(attrs: Record<string, unknown>) {
  nodeProps.updateAttributes({ props: attrs })
}

// Delete image
function deleteImage() {
  const pos = nodeProps.getPos() as number
  const transaction = nodeProps.editor.state.tr.delete(pos, pos + nodeProps.node.nodeSize)
  nodeProps.editor.view.dispatch(transaction)
  isPopoverOpen.value = false
}

// Check if image has valid src
const hasValidSrc = computed(() => !!imageAttrs.value.src)

// Build image style
const imageStyle = computed(() => {
  const style: Record<string, string> = {}
  if (imageAttrs.value.width) style.width = imageAttrs.value.width
  if (imageAttrs.value.height) style.height = imageAttrs.value.height
  return style
})

// Selected state
const isSelected = computed(() => nodeProps.selected)

// Check if has custom attributes
const hasAttributes = computed(() => {
  return !!(imageAttrs.value.alt || imageAttrs.value.title || imageAttrs.value.width || imageAttrs.value.height || imageAttrs.value.class)
})
</script>

<template>
  <NodeViewWrapper
    as="div"
    class="relative group my-2"
  >
    <div
      :contenteditable="false"
      class="relative rounded-lg overflow-hidden transition-all"
      :class="[
        isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-700',
      ]"
    >
      <!-- Image -->
      <img
        v-if="hasValidSrc"
        :src="imageAttrs.src"
        :alt="imageAttrs.alt"
        :width="imageAttrs.width || undefined"
        :height="imageAttrs.height || undefined"
        :class="imageAttrs.class"
        :style="imageStyle"
        class="w-full h-auto block"
        @click="isPopoverOpen = true"
      >

      <!-- Placeholder for missing src -->
      <div
        v-else
        class="flex items-center justify-center bg-muted text-muted min-h-40 cursor-pointer"
        @click="isPopoverOpen = true"
      >
        <div class="flex flex-col items-center gap-2">
          <UIcon
            name="i-lucide-image-off"
            class="size-8"
          />
          <span class="text-sm">{{ t('studio.tiptap.image.no_source') || 'No image source' }}</span>
        </div>
      </div>

      <!-- Toolbar (visible on hover or when selected) -->
      <div
        class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        :class="{ 'opacity-100': isPopoverOpen || isSelected }"
      >
        <UPopover v-model:open="isPopoverOpen">
          <UTooltip
            :text="t('studio.tiptap.image.edit') || 'Edit image'"
            :disabled="isPopoverOpen"
          >
            <UButton
              variant="solid"
              size="2xs"
              color="primary"
              class="border border-white"
              icon="i-lucide-sliders-horizontal"
              :aria-label="t('studio.tiptap.image.edit')"
              @click.stop
            />
          </UTooltip>

          <template #content>
            <TiptapComponentProps
              :node="nodeProps.node"
              :update-props="updateImageAttributes"
              :override-meta="imageMeta"
            />
          </template>
        </UPopover>

        <UTooltip :text="t('studio.tiptap.image.delete')">
          <UButton
            variant="solid"
            size="2xs"
            color="primary"
            class="border border-white"
            icon="i-lucide-trash"
            :aria-label="t('studio.tiptap.image.delete')"
            @click.stop="deleteImage"
          />
        </UTooltip>
      </div>

      <!-- Attributes indicator (bottom-left corner) -->
      <div
        v-if="hasValidSrc && hasAttributes"
        class="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <UBadge
          size="xs"
          color="neutral"
          variant="subtle"
        >
          {{ Object.entries(imageAttrs).filter(([k, v]) => k !== 'src' && v).length }} {{ Object.entries(imageAttrs).filter(([k, v]) => k !== 'src' && v).length === 1 ? 'attribute' : 'attributes' }}
        </UBadge>
      </div>
    </div>

    <NodeViewContent as="span" />
  </NodeViewWrapper>
</template>
