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

// Function to focus a different slot
function focusSlot(targetSlotName: string) {
  if (targetSlotName === slotName.value) return

  const pos = nodeProps.getPos()
  if (typeof pos === 'undefined') return

  const $pos = nodeProps.editor.state.doc.resolve(pos)
  const parentNode = $pos.parent

  // Find the absolute position of the target slot
  let currentPos = $pos.before() + 1 // Start of parent's content

  for (let i = 0; i < parentNode.content.childCount; i++) {
    const child = parentNode.content.child(i)

    if (child.type.name === 'slot' && child.attrs.name === targetSlotName) {
      // Found the target slot, need to find a text position inside it
      // Skip past the slot node itself (currentPos + 1)
      // Then skip past the first child block node (e.g., paragraph) to get to text position
      const textPos = currentPos + 2 // slot start + 1 + block node start + 1

      nodeProps.editor.commands.setTextSelection(textPos)
      nodeProps.editor.commands.focus()
      return
    }

    // Move to next child
    currentPos += child.nodeSize
  }
}

// Get all slots content from parent for display
const slots = computed(() => {
  const slotMap: Record<string, { content: string, isEmpty: boolean }> = {
    headline: { content: '', isEmpty: true },
    title: { content: '', isEmpty: true },
    description: { content: '', isEmpty: true },
    links: { content: '', isEmpty: true },
  }

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
        }
      }
    }
  })

  return slotMap
})
</script>

<template>
  <NodeViewWrapper as="div">
    <div
      class="relative group"
      :class="{ hidden: !shouldRenderComponent }"
    >
      <!-- Hover border with component name -->
      <div class="opacity-0 group-hover:opacity-150 transition-opacity absolute inset-0 border-2 border-dashed border-muted rounded-lg pointer-events-none" />
      <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 left-2 bg-white px-2 text-xs font-medium text-muted z-10">
        UPageHero
      </div>

      <UPageHero v-bind="componentProps">
        <template #headline>
          <div
            v-if="slotName === 'headline'"
            class="min-h-[40px]"
          >
            <NodeViewContent />
          </div>
          <div
            v-else
            class="cursor-pointer hover:bg-primary/5 rounded-lg p-2 transition-colors"
            @click="focusSlot('headline')"
          >
            <span
              v-if="slots.headline.isEmpty"
              class="opacity-40 italic"
            >Headline</span>
            <span v-else>{{ slots.headline.content }}</span>
          </div>
        </template>

        <template #title>
          <div
            v-if="slotName === 'title'"
            class="min-h-[40px]"
          >
            <NodeViewContent />
          </div>
          <div
            v-else
            class="cursor-pointer hover:bg-primary/5 rounded-lg p-2 transition-colors"
            @click="focusSlot('title')"
          >
            <span
              v-if="slots.title.isEmpty"
              class="opacity-40 italic"
            >Title</span>
            <span v-else>{{ slots.title.content }}</span>
          </div>
        </template>

        <template #description>
          <div
            v-if="slotName === 'description'"
            class="min-h-[40px]"
          >
            <NodeViewContent />
          </div>
          <div
            v-else
            class="cursor-pointer hover:bg-primary/5 rounded-lg p-2 transition-colors"
            @click="focusSlot('description')"
          >
            <span
              v-if="slots.description.isEmpty"
              class="opacity-40 italic"
            >Description</span>
            <span v-else>{{ slots.description.content }}</span>
          </div>
        </template>

        <template #links>
          <div
            v-if="slotName === 'links'"
            class="min-h-[40px]"
          >
            <NodeViewContent />
          </div>
          <div
            v-else
            class="cursor-pointer hover:bg-primary/5 rounded-lg p-2 transition-colors"
            @click="focusSlot('links')"
          >
            <span
              v-if="slots.links.isEmpty"
              class="opacity-40 italic"
            >Links</span>
            <span v-else>{{ slots.links.content }}</span>
          </div>
        </template>
      </UPageHero>
    </div>
  </NodeViewWrapper>
</template>
