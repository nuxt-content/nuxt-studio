<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { useI18n } from 'vue-i18n'
import type { ComponentMeta } from '../../../types'
import TiptapComponentProps from '../TiptapComponentProps.vue'
import { sanitizeMediaUrl } from '../../../utils/tiptap/props'

const nodeProps = defineProps(nodeViewProps)
const { t } = useI18n()

const isPopoverOpen = ref(false)

// Metadata for video node
const videoMeta = {
  name: 'Video',
  path: '',
  meta: {
    props: [
      {
        name: 'src',
        global: false,
        description: t('studio.tiptap.video.source'),
        tags: [],
        required: true,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'poster',
        global: false,
        description: t('studio.tiptap.video.poster'),
        tags: [],
        required: false,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'width',
        global: false,
        description: t('studio.tiptap.video.width'),
        tags: [],
        required: false,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'height',
        global: false,
        description: t('studio.tiptap.video.height'),
        tags: [],
        required: false,
        type: 'string',
        declarations: [],
        schema: { kind: 'enum', type: 'string', schema: [] },
      },
      {
        name: 'controls',
        global: false,
        description: t('studio.tiptap.video.controls'),
        tags: [],
        required: false,
        type: 'boolean',
        declarations: [],
        schema: { kind: 'enum', type: 'boolean', schema: [] },
      },
      {
        name: 'autoplay',
        global: false,
        description: t('studio.tiptap.video.autoplay'),
        tags: [],
        required: false,
        type: 'boolean',
        declarations: [],
        schema: { kind: 'enum', type: 'boolean', schema: [] },
      },
      {
        name: 'loop',
        global: false,
        description: t('studio.tiptap.video.loop'),
        tags: [],
        required: false,
        type: 'boolean',
        declarations: [],
        schema: { kind: 'enum', type: 'boolean', schema: [] },
      },
      {
        name: 'muted',
        global: false,
        description: t('studio.tiptap.video.muted'),
        tags: [],
        required: false,
        type: 'boolean',
        declarations: [],
        schema: { kind: 'enum', type: 'boolean', schema: [] },
      },
    ],
    slots: [],
    events: [],
  },
} as unknown as ComponentMeta

// Video attributes
const videoAttrs = computed(() => {
  const props = nodeProps.node.attrs.props || {}
  const src = props.src || ''
  return {
    src: sanitizeMediaUrl(src, 'video') || '',
    poster: props.poster || '',
    width: props.width || '',
    height: props.height || '',
    class: props.class || '',
    controls: props.controls !== undefined ? props.controls : true,
    autoplay: props.autoplay || false,
    loop: props.loop || false,
    muted: props.muted || false,
  }
})

// Update attributes from TiptapComponentProps
function updateVideoAttributes(attrs: Record<string, unknown>) {
  nodeProps.updateAttributes({ props: attrs })
}

// Delete video
function deleteVideo() {
  const pos = nodeProps.getPos() as number
  const transaction = nodeProps.editor.state.tr.delete(pos, pos + nodeProps.node.nodeSize)
  nodeProps.editor.view.dispatch(transaction)
  isPopoverOpen.value = false
}

// Check if video has valid src
const hasValidSrc = computed(() => !!videoAttrs.value.src)

// Selected state
const isSelected = computed(() => nodeProps.selected)

// Auto-open popover if src is empty (for external source entry)
onMounted(() => {
  if (!nodeProps.node.attrs.props?.src) {
    isPopoverOpen.value = true
  }
})
</script>

<template>
  <NodeViewWrapper
    as="div"
    class="relative group my-2"
  >
    <div
      :contenteditable="false"
      class="relative rounded-lg overflow-hidden transition-all inline-block"
      :class="[
        isSelected ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-gray-300 dark:hover:ring-gray-700',
      ]"
    >
      <!-- Video -->
      <video
        v-if="hasValidSrc"
        :src="videoAttrs.src"
        :poster="videoAttrs.poster || undefined"
        :width="videoAttrs.width || undefined"
        :height="videoAttrs.height || undefined"
        :class="videoAttrs.class"
        :controls="videoAttrs.controls"
        :autoplay="videoAttrs.autoplay"
        :loop="videoAttrs.loop"
        :muted="videoAttrs.muted"
        @click="isPopoverOpen = true"
      />

      <!-- Placeholder for missing src -->
      <div
        v-else
        class="flex items-center justify-center bg-muted text-muted min-h-40 cursor-pointer p-8"
        @click="isPopoverOpen = true"
      >
        <div class="flex flex-col items-center gap-2">
          <UIcon
            name="i-lucide-video-off"
            class="size-8"
          />
          <span class="text-sm">{{ t('studio.tiptap.video.noSource') }}</span>
        </div>
      </div>

      <!-- Toolbar (visible on hover or when selected) -->
      <div
        class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        :class="{ 'opacity-100': isPopoverOpen || isSelected }"
      >
        <UPopover v-model:open="isPopoverOpen">
          <UTooltip
            :text="t('studio.tiptap.video.edit') || 'Edit video'"
            :disabled="isPopoverOpen"
          >
            <UButton
              variant="solid"
              size="2xs"
              color="primary"
              class="border border-white"
              icon="i-lucide-sliders-horizontal"
              :aria-label="t('studio.tiptap.video.edit')"
              @click.stop
            />
          </UTooltip>

          <template #content>
            <TiptapComponentProps
              :node="nodeProps.node"
              :update-props="updateVideoAttributes"
              :override-meta="videoMeta"
            />
          </template>
        </UPopover>

        <UTooltip :text="t('studio.tiptap.video.delete')">
          <UButton
            variant="solid"
            size="2xs"
            color="primary"
            class="border border-white"
            icon="i-lucide-trash"
            :aria-label="t('studio.tiptap.video.delete')"
            @click.stop="deleteVideo"
          />
        </UTooltip>
      </div>
    </div>

    <NodeViewContent as="span" />
  </NodeViewWrapper>
</template>
