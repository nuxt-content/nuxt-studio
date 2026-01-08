<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { useStudio } from '../../../composables/useStudio'

const nodeProps = defineProps(nodeViewProps)

const { host } = useStudio()

// @ts-expect-error vue-tsc error in cli
const nodeViewContentEl = ref<HTMLElement>()

const isHovered = ref(false)
const isEditable = ref(true) // TODO: Connect to editor state

const slotName = computed({
  get: () => nodeProps.node.attrs.name || 'default',
  set: (value: string | { value: string, label: string }) => {
    const newName = (typeof value === 'string' ? value : value.value) || 'default'
    nodeProps.updateAttributes({ name: newName })
  },
})

const parent = computed(() => {
  const pos = nodeProps.getPos()
  if (typeof pos === 'undefined') return null

  const $pos = nodeProps.editor.state.doc.resolve(pos)
  return $pos.parent
})

const componentMeta = computed(() => host.meta.getComponents().find(c => c.name === parent.value?.attrs.tag))
const slots = computed(() => componentMeta.value?.meta.slots || [])
const showSlotSelection = computed(() => slots.value.length > 1)
const availableSlots = computed(() => slots.value.map(s => s.name))
const isLastRemainingSlot = computed(() => parent.value?.childCount === 1)

function deleteSlot() {
  nodeProps.editor.commands.command(({ tr }) => {
    const pos = nodeProps.getPos()
    if (typeof pos === 'undefined') return false

    tr.delete(pos, pos + nodeProps.node.nodeSize)
    return true
  })
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div class="my-2">
      <div
        v-if="showSlotSelection"
        class="flex items-center gap-2 mb-2 group"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <USelectMenu
          v-model="slotName"
          :items="availableSlots"
          :disabled="!isEditable"
          :content="{ align: 'start' }"
          :placeholder="$t('studio.tiptap.slot.searchPlaceholder')"
          size="xs"
          :ui="{
            base: 'font-mono text-xs text-muted hover:text-default uppercase cursor-pointer ring-0',
          }"
        >
          <template #leading>
            <span class="text-muted">#</span>
          </template>

          <template #empty>
            <div class="text-xs text-muted py-2">
              {{ $t('studio.tiptap.slot.noSlotsAvailable') }}
            </div>
          </template>
        </USelectMenu>

        <UTooltip :text="$t('studio.tiptap.slot.deleteSlot')">
          <UButton
            variant="ghost"
            size="2xs"
            class="text-muted hover:text-default"
            icon="i-lucide-trash"
            :disabled="!isEditable || isLastRemainingSlot"
            :aria-label="$t('studio.tiptap.slot.deleteSlot')"
            @click="deleteSlot"
          />
        </UTooltip>
      </div>

      <div
        class="pl-5 border-l-2 border-dashed border-default"
      >
        <NodeViewContent ref="nodeViewContentEl" />
      </div>
    </div>
  </NodeViewWrapper>
</template>
