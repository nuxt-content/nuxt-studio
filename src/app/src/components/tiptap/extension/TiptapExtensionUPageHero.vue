<script setup lang="ts">
import { ref, computed } from 'vue'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'

const nodeProps = defineProps(nodeViewProps)

const componentProps = computed(() => nodeProps.node.attrs.props || {})
const editingSlot = ref<string | null>(null)
const nodeViewContentEl = ref<HTMLElement>()

// Get slot contents for display
const slots = computed(() => {
  const slotMap: Record<string, { content: string, isEmpty: boolean }> = {
    headline: { content: '', isEmpty: true },
    title: { content: '', isEmpty: true },
    description: { content: '', isEmpty: true },
    links: { content: '', isEmpty: true },
  }

  const content = nodeProps.node.content?.content || []
  content.forEach((child: unknown) => {
    if (typeof child === 'object' && child !== null && 'type' in child) {
      const childNode = child as { type: { name: string }, attrs: { name?: string }, textContent?: string }
      if (childNode.type.name === 'slot') {
        const slotName = childNode.attrs.name || 'default'
        const textContent = childNode.textContent || ''
        slotMap[slotName] = {
          content: textContent,
          isEmpty: !textContent.trim(),
        }
      }
    }
  })

  return slotMap
})

function startEditing(slotName: string) {
  editingSlot.value = slotName
  // Update the node attribute so child slots can read it
  nodeProps.updateAttributes({ editingSlot: slotName })
}

function stopEditing() {
  editingSlot.value = null
  // Clear the editing slot attribute
  nodeProps.updateAttributes({ editingSlot: null })
}
</script>

<template>
  <NodeViewWrapper
    as="div"
    class="my-6 border border-gray-200 rounded-xl transition-all duration-200"
    :class="{ 'border-primary shadow-sm': editingSlot }"
  >
    <div class="p-6">
      <!-- Edit Mode Header -->
      <div
        v-if="editingSlot"
        class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200"
      >
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-xs text-gray-500">
            <span>UPageHero</span>
            <span>/</span>
          </div>
          <span class="text-sm font-semibold text-primary capitalize flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Editing {{ editingSlot }}
          </span>
        </div>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-check"
          @click="stopEditing"
        >
          Done
        </UButton>
      </div>

      <!-- Display Mode: Overlay with UPageHero -->
      <div
        v-show="!editingSlot"
        class="display-overlay"
      >
        <UPageHero v-bind="componentProps">
          <template #headline>
            <div
              class="relative cursor-pointer rounded-lg p-3 -m-3 transition-all duration-200 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 group"
              @click="startEditing('headline')"
            >
              <span
                v-if="slots.headline.isEmpty"
                class="opacity-40 italic"
              >Headline</span>
              <span v-else>{{ slots.headline.content }}</span>
              <span class="absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                headline
              </span>
            </div>
          </template>

          <template #title>
            <div
              class="relative cursor-pointer rounded-lg p-3 -m-3 transition-all duration-200 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 group"
              @click="startEditing('title')"
            >
              <span
                v-if="slots.title.isEmpty"
                class="opacity-40 italic"
              >Title</span>
              <span v-else>{{ slots.title.content }}</span>
              <span class="absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                title
              </span>
            </div>
          </template>

          <template #description>
            <div
              class="relative cursor-pointer rounded-lg p-3 -m-3 transition-all duration-200 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 group"
              @click="startEditing('description')"
            >
              <span
                v-if="slots.description.isEmpty"
                class="opacity-40 italic"
              >Description</span>
              <span v-else>{{ slots.description.content }}</span>
              <span class="absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                description
              </span>
            </div>
          </template>

          <template #links>
            <div
              class="relative cursor-pointer rounded-lg p-3 -m-3 transition-all duration-200 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 group"
              @click="startEditing('links')"
            >
              <span
                v-if="slots.links.isEmpty"
                class="opacity-40 italic"
              >Links</span>
              <span v-else>{{ slots.links.content }}</span>
              <span class="absolute top-2 right-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide bg-primary text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                links
              </span>
            </div>
          </template>
        </UPageHero>
      </div>

      <!-- NodeViewContent - Always rendered, shown only in edit mode -->
      <NodeViewContent
        v-show="editingSlot"
        ref="nodeViewContentEl"
        class="tiptap-content"
      />
    </div>
  </NodeViewWrapper>
</template>
