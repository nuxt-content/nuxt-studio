<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { kebabCase } from 'scule'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { useStudio } from '../../../composables/useStudio'
import { getSlotDisplay } from '../../../utils/tiptap/slots'

const nodeProps = defineProps(nodeViewProps)

const { host } = useStudio()

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

const componentMeta = computed(() => host.meta.editor.components.get().find(c => kebabCase(c.name) === kebabCase(parent.value?.attrs.tag)))
const slots = computed(() => componentMeta.value?.meta.slots || [])
const showSlotSelection = computed(() => slots.value.length > 1)
const usedSlots = computed(() =>
  (parent.value?.content?.content as ProseMirrorNode[] || [])
    .map(slot => slot.attrs.name as string),
)
// All declared slots minus those already used by siblings (including this slot itself)
const availableSlots = computed(() => slots.value
  .filter(slot => !usedSlots.value.includes(slot.name))
  .map(slot => ({ value: slot.name, ...getSlotDisplay(componentMeta.value, slot.name) })))
const currentSlotDisplay = computed(() => getSlotDisplay(componentMeta.value, slotName.value))
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
        class="flex items-center gap-2 mb-2"
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
            content: 'z-[9999]',
          }"
        >
          <template #leading>
            <span class="text-muted">#</span>
          </template>

          <template #default>
            {{ currentSlotDisplay.label }}
          </template>

          <template #empty>
            <div class="text-xs text-muted py-2">
              {{ $t('studio.tiptap.slot.noSlotsAvailable') }}
            </div>
          </template>
        </USelectMenu>

        <UTooltip
          v-if="currentSlotDisplay.description"
          :text="currentSlotDisplay.description"
        >
          <UIcon
            name="i-lucide-circle-help"
            class="size-3.5 text-muted shrink-0"
          />
        </UTooltip>

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
        <NodeViewContent />
      </div>
    </div>
  </NodeViewWrapper>
</template>
