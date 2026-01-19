<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

// Get the parent UPageHero node to access its props
const parent = computed(() => {
  const pos = nodeProps.getPos()
  if (typeof pos === 'undefined') return null

  const $pos = nodeProps.editor.state.doc.resolve(pos)
  return $pos.parent
})

const componentProps = computed(() => parent.value?.attrs.props || {})

const slotName = computed(() => {
  return nodeProps.node.attrs.name || 'default'
})

// Track which slot is currently being edited based on editor selection
const editingSlotName = ref<string>('')

// Watch editor selection to determine which slot has focus
// [TODO PERFORMANCE] The `watch` on `editor.state.selection` iterates over **all** child nodes of the parent `u-page-hero` on every selection change to find the active slot. For documents with many slots this could become a noticeable overhead. We should monitore this and improve it.
watch(
  () => nodeProps.editor.state.selection,
  () => {
    const { from } = nodeProps.editor.state.selection
    const pos = nodeProps.getPos()
    if (typeof pos === 'undefined') return

    const $pos = nodeProps.editor.state.doc.resolve(pos)
    const parentNode = $pos.parent

    // Check if parent is the u-page-hero (only process if we're inside it)
    if (parentNode?.type.name !== 'u-page-hero') return

    // Find which slot contains the cursor
    let currentPos = $pos.before() + 1

    for (let i = 0; i < parentNode.content.childCount; i++) {
      const child = parentNode.content.child(i)
      const childEnd = currentPos + child.nodeSize

      if (child.type.name === 'slot' && from >= currentPos && from < childEnd) {
        editingSlotName.value = child.attrs.name || 'default'
        return
      }

      currentPos = childEnd
    }
  },
  { immediate: true },
)

// Each slot of the component is rendering the full component when it is being edited
// Only the focus slot must display the full component
const shouldRenderComponent = computed(() => {
  return editingSlotName.value === slotName.value
})

// Define all available slots with their metadata
// TODO: This can be dynamic and fetched from the component meta
const SLOT_CONFIG = [
  { name: 'headline', label: 'Headline' },
  { name: 'title', label: 'Title' },
  { name: 'description', label: 'Description' },
  { name: 'links', label: 'Links' },
] as const

// Helper to get parent node and position info
function getParentInfo() {
  const pos = nodeProps.getPos()
  if (typeof pos === 'undefined') return null

  const $pos = nodeProps.editor.state.doc.resolve(pos)
  return {
    $pos,
    parentNode: $pos.parent,
    startPos: $pos.before() + 1,
  }
}

// Find the position of a specific slot or where to insert it
function findSlotPosition(targetSlotName: string) {
  const info = getParentInfo()
  if (!info) return null

  const { parentNode, startPos } = info
  const slotOrder = SLOT_CONFIG.map(s => s.name) as unknown as string[]
  const targetIndex = slotOrder.indexOf(targetSlotName)

  let currentPos = startPos

  for (let i = 0; i < parentNode.content.childCount; i++) {
    const child = parentNode.content.child(i)

    if (child.type.name === 'slot') {
      const childSlotName = child.attrs.name || 'default'

      // Found the exact slot we're looking for
      if (childSlotName === targetSlotName) {
        return { pos: currentPos, exists: true }
      }

      // For insertion: found a slot that should come after our target
      const childIndex = slotOrder.indexOf(childSlotName)
      if (childIndex > targetIndex) {
        return { pos: currentPos, exists: false }
      }
    }

    currentPos += child.nodeSize
  }

  // Slot doesn't exist and should be inserted at the end
  return { pos: currentPos, exists: false }
}

// Get all slots content from parent for display
const slots = computed(() => {
  // Initialize slot map with all configured slots as empty
  const slotMap: Record<string, { content: string, isEmpty: boolean, exists: boolean }> = {}
  SLOT_CONFIG.forEach((slot) => {
    slotMap[slot.name] = { content: '', isEmpty: true, exists: false }
  })

  // Update slot map with actual content from document
  const content = parent.value?.content?.content || []
  content.forEach((child: unknown) => {
    if (typeof child === 'object' && child !== null && 'type' in child) {
      const childNode = child as { type: { name: string }, attrs: { name?: string }, textContent?: string }
      if (childNode.type.name === 'slot') {
        const name = childNode.attrs.name || 'default'
        const textContent = childNode.textContent || ''
        slotMap[name] = {
          content: textContent,
          isEmpty: !textContent.trim(),
          exists: true,
        }
      }
    }
  })

  return slotMap
})

// Function to handle slot click (create or focus)
function handleSlotClick(slotName: string) {
  if (slots.value[slotName]?.exists) {
    focusSlot(slotName)
  }
  else {
    createSlot(slotName)
  }
}

// Function to focus a different slot
function focusSlot(targetSlotName: string, cachedPosition?: number) {
  if (targetSlotName === slotName.value) return

  let slotPos: number

  // Use cached position if provided, otherwise find it
  if (cachedPosition !== undefined) {
    slotPos = cachedPosition
  }
  else {
    const foundPos = findSlotPosition(targetSlotName)
    if (!foundPos || !foundPos.exists) return
    slotPos = foundPos.pos
  }

  // Calculate text position inside the slot
  // +1 to enter slot node, +1 to enter first child block (paragraph)
  const textPos = slotPos + 2

  nodeProps.editor.commands.setTextSelection(textPos)
  nodeProps.editor.commands.focus()
}

// Function to create a missing slot
function createSlot(slotName: string) {
  const slotPos = findSlotPosition(slotName)
  if (!slotPos || slotPos.exists) return

  // Create the new slot node
  const newSlot = {
    type: 'slot',
    attrs: { name: slotName },
    content: [{ type: 'paragraph', content: [] }],
  }

  // Insert the slot and focus it
  nodeProps.editor.commands.command(({ tr }) => {
    tr.insert(slotPos.pos, nodeProps.editor.schema.nodeFromJSON(newSlot)!)
    return true
  })

  // Focus the new slot after a short delay to let it render
  // Pass the cached position to avoid recalculating
  setTimeout(() => {
    focusSlot(slotName, slotPos.pos)
  }, 10)
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div :class="{ hidden: !shouldRenderComponent }">
      <UPageHero v-bind="componentProps">
        <template
          v-for="slot in SLOT_CONFIG"
          :key="slot.name"
          #[slot.name]
        >
          <!-- Editable slot: render NodeViewContent -->
          <div
            v-if="slotName === slot.name"
            class="min-h-[40px]"
          >
            <NodeViewContent />
          </div>

          <!-- Non-editable slot: render preview with click handler -->
          <div
            v-else
            class="cursor-pointer hover:bg-primary/5 rounded-lg p-2 transition-colors"
            @click="handleSlotClick(slot.name)"
          >
            <span
              v-if="slots[slot.name].isEmpty"
              class="opacity-40 italic"
            >{{ slot.label }}</span>
            <span v-else>{{ slots[slot.name].content }}</span>
          </div>
        </template>
      </UPageHero>
    </div>
  </NodeViewWrapper>
</template>
