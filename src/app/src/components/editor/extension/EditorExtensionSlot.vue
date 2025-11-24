<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { titleCase } from 'scule'
// import { pascalCase } from 'scule'
// import { tiptapChildrenNodes, tiptapParentNode } from '../../utils/tiptap'

const nodeProps = defineProps(nodeViewProps)

// const parentNodeEl = ref(null)

// const { project } = useProjects()
// const { meta } = useProjectMeta(project.value)
// const { isEditable } = useTiptapEditor()

// const isHovered = ref(false)

// onMounted(() => {
//   setTimeout(() => {
//     applyBg()
//   }, 100)
// })

/* Computed */
// const slotName = computed({
//   get: () => nodeProps.node.attrs.name,
//   set: (value) => {
//     value = (typeof value === 'string' ? value : value.value) || 'default'
//     nodeProps.updateAttributes({ name: value })
//   },
// })

// const parent = computed(() => tiptapParentNode(nodeProps.editor.state.doc, nodeProps.getPos()))
// const children = computed(() => tiptapChildrenNodes(nodeProps.editor.state.doc, toRaw(parent.value)) || [])
// const isLastRemainingSlot = computed(() => parent.value?.childCount === 1)
// const slots = computed(() => meta.value?.components.find(c => c.name === pascalCase(parent.value?.attrs?.tag))?.meta?.slots || [])
// const availableSlots = computed(() => {
//   const slotsArray = slots.value.reduce((acc, slot) => {
//     if (!children.value.map(c => c.attrs.name).includes(slot.name) || slot.name === slotName.value) {
//       acc.push({ label: slot.name, value: slot.name })
//     }
//     return acc
//   }, [] as { label: string, value: string }[])
//   return slotsArray
// })
// const slotSelection = computed(() => !isLastRemainingSlot.value || slots.value?.length > 1)

// const deleteSlot = () => {
//   nodeProps.editor.commands.command(({ tr }) => {
//     const pos = nodeProps.getPos()
//     tr.delete(pos, pos + nodeProps.node.nodeSize)
//     return true
//   })
// }

// ========================================
// NEW IMPLEMENTATION - Nuxt UI v4
// ========================================

// State
const nodeViewContentEl = ref<HTMLElement>()
const isHovered = ref(false)
const isEditable = ref(true) // TODO: Connect to editor state

// Computed Properties
const slotName = computed({
  get: () => nodeProps.node.attrs.name || 'default',
  set: (value: string | { value: string, label: string }) => {
    const newName = (typeof value === 'string' ? value : value.value) || 'default'
    nodeProps.updateAttributes({ name: newName })
  },
})

// Get parent element context
const parent = computed(() => {
  const pos = nodeProps.getPos()
  if (typeof pos === 'undefined') return null

  const $pos = nodeProps.editor.state.doc.resolve(pos)
  return $pos.parent
})

// Check if this is the last slot in the component
const isLastRemainingSlot = computed(() => {
  return parent.value?.childCount === 1
})

// Available slots for selection
// TODO: Get from component metadata
const slots = [
  { label: 'Default', value: 'default' },
]

const availableSlots = computed(() => {
  return slots
})

// Show slot selection UI
const showSlotSelection = computed(() => {
  return !isLastRemainingSlot.value || availableSlots.value.length > 1
})

const slotLabel = computed(() => titleCase(slotName.value))

// Event Handlers
function deleteSlot() {
  nodeProps.editor.commands.command(({ tr }) => {
    const pos = nodeProps.getPos()
    if (typeof pos === 'undefined') return false

    tr.delete(pos, pos + nodeProps.node.nodeSize)
    return true
  })
}

function createSlot(name: string) {
  slots.push({ label: titleCase(name), value: name })
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div class="my-2">
      <!-- Slot Selector Header -->
      <div
        v-if="showSlotSelection"
        class="flex items-center gap-2 mb-2 group"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Slot Name Selector -->
        <USelectMenu
          v-model="slotName"
          :items="availableSlots"
          :disabled="!isEditable"
          create-item
          placeholder="Search or create a slot..."
          size="xs"
          :ui="{
            base: 'font-mono text-xs text-muted hover:text-default uppercase cursor-pointer ring-0',
            leading: 'ps-0',
          }"
          @create="createSlot"
        >
          <template #leading>
            <span class="text-muted">#</span>
          </template>

          <template #label>
            {{ slotLabel }}
          </template>

          <template #empty>
            <div class="text-xs text-muted py-2">
              No predefined slots available
            </div>
          </template>
        </USelectMenu>

        <!-- Delete Slot Button -->
        <UTooltip text="Delete slot">
          <UButton
            variant="ghost"
            size="xs"
            icon="i-lucide-trash"
            :disabled="!isEditable || isLastRemainingSlot"
            aria-label="Delete slot"
            @click="deleteSlot"
          />
        </UTooltip>
      </div>

      <!-- Simple Label (when slot selection is disabled) -->
      <div
        v-else
        class="flex items-center gap-2 mb-2 text-muted text-xs font-mono"
        :contenteditable="false"
      >
        <span>#</span>
        <span>{{ slotLabel }}</span>
      </div>

      <!-- Slot Content -->
      <div class="pl-5 border-l-2 border-dashed border-default">
        <NodeViewContent ref="nodeViewContentEl" />
      </div>
    </div>
  </NodeViewWrapper>
</template>

