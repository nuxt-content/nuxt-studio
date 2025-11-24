<script setup lang="ts">
import { ref, computed } from 'vue'
import { TextSelection } from 'prosemirror-state'
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { titleCase, kebabCase } from 'scule'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { useStudio } from '../../../composables/useStudio'
import { standardElements } from '../../../utils/tiptap/editor'
// import { lowerCase } from 'lodash-es'
// import { tiptapParentNode } from '../../utils/tiptap'
// import MDCEditorComponentPropxs from '../../MDCEditorComponentProps.vue'
// import { mdcStandardElementsName, mdcStandardElementsIcon } from '../../utils/mdc'

const nodeProps = defineProps(nodeViewProps)

const nodeViewContent = ref<HTMLElement>()

const node = computed(() => nodeProps.node)

const { host } = useStudio()

const collapsed = ref(false)
const openPropsPopover = ref(false)
const isEditable = ref(true) // TODO: Connect to editor state

// Computed Properties
const componentTag = computed(() => nodeProps.node.attrs.tag)
const componentName = computed(() => titleCase(componentTag.value).replace(/^U /, ''))
const hasSlots = computed(() => nodeProps.node.content.size > 0)
const componentProps = computed(() => nodeProps.node.attrs.props || {})
const componentMeta = computed(() => host.meta.components.find(c => kebabCase(c.name) === kebabCase(node.value.attrs?.tag)))

const standardElement = computed(() => standardElements[componentTag.value])
const displayName = computed(() => standardElement.value?.name || componentName.value)
const displayIcon = computed(() => standardElement.value?.icon || 'i-lucide-box')

// TODO: Get from component metadata
const availableSlots = computed(() => ['default', 'header', 'footer'])
const usedSlots = computed(() => {
  const slots = (node.value.content?.content || []) as ProseMirrorNode[]
  return slots.map(s => s.attrs.name)
})

// Event Handlers
function onToggleCollapse(event: Event) {
  event.stopPropagation()
  event.preventDefault()

  if (hasSlots.value) {
    collapsed.value = !collapsed.value
  }
  else {
    openPropsPopover.value = true
  }
}

function onEditProps(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  openPropsPopover.value = !openPropsPopover.value
}

function onDelete(event: Event) {
  event.stopPropagation()
  event.preventDefault()
  nodeProps.deleteNode()
}

function onAddSlot(event: Event) {
  event.stopPropagation()
  event.preventDefault()

  const unusedSlot = availableSlots.value.find(s => !usedSlots.value.includes(s))
  if (unusedSlot) {
    addSlot(unusedSlot)
  }
}

function addSlot(name: string) {
  const { editor } = nodeProps
  const slots = (node.value.content?.content || []) as ProseMirrorNode[]

  // Calculate position to insert new slot at the end
  const elementSize = slots.map(s => s.nodeSize).reduce((acc, cur) => acc + cur, 1)
  const pos = nodeProps.getPos()

  if (typeof pos === 'undefined') {
    return
  }

  // Create slot with empty paragraph
  const pNode = editor.schema.nodes.paragraph.create({}, [])
  const slotNode = editor.schema.nodes.slot.create({ name }, pNode)

  // Insert and focus
  const tr = editor.state.tr.insert(pos + elementSize, slotNode)
  tr.setSelection(TextSelection.near(tr.doc.resolve(pos + elementSize)) as never)
  editor.view.dispatch(tr)
  editor.view.focus()
}

// TODO: Implement props editor component and use this function
function _updateProps(props: Record<string, unknown>) {
  nodeProps.updateAttributes({ props })
}
</script>

<template>
  <NodeViewWrapper as="div">
    <div class="my-3">
      <!-- Component Header -->
      <div
        class="group flex items-center justify-between px-3 py-2 rounded-lg border border-default bg-elevated hover:bg-muted cursor-pointer transition-colors duration-150"
        :contenteditable="false"
        @click="onToggleCollapse"
      >
        <!-- Left: Icon + Name -->
        <div class="flex items-center gap-2.5">
          <!-- Collapse/Expand Icon for components with slots -->
          <UIcon
            v-if="hasSlots"
            :name="collapsed ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
            class="size-4 text-muted transition-transform duration-150"
            :class="{ 'text-dimmed': collapsed }"
          />
          <!-- Component Icon -->
          <UIcon
            v-else
            :name="displayIcon"
            class="size-4 text-muted"
            :class="{ 'text-dimmed': collapsed }"
          />

          <!-- Component Name -->
          <span
            class="text-sm font-mono font-medium text-default"
            :class="{ 'text-muted': collapsed }"
          >
            {{ displayName }}
          </span>

          <!-- Props Count Badge (if has props) -->
          <UBadge
            v-if="Object.keys(componentProps).length > 0"
            color="neutral"
            variant="subtle"
            size="xs"
          >
            {{ Object.keys(componentProps).length }} {{ Object.keys(componentProps).length === 1 ? 'prop' : 'props' }}
          </UBadge>
        </div>

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <!-- Add Slot -->
          <UTooltip text="Add slot">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-plus"
              :disabled="!isEditable"
              aria-label="Add slot"
              @click="onAddSlot"
            />
          </UTooltip>

          <!-- Edit Props -->
          <UPopover v-model:open="openPropsPopover">
            <UTooltip text="Edit props">
              <UButton
                variant="ghost"
                size="xs"
                icon="i-lucide-settings"
                :disabled="!isEditable"
                aria-label="Edit props"
                @click="onEditProps"
              />
            </UTooltip>

            <template #content>
              <div class="p-4 w-80">
                <div class="text-sm font-medium text-highlighted mb-3">
                  Component Props
                </div>
                <div class="text-xs text-muted">
                  Props editor will be implemented soon...
                </div>
                <!-- TODO: Implement MDCEditorComponentProps or create new component -->
                <!-- <MDCEditorComponentProps
                  :node="node"
                  :update-props="updateProps"
                /> -->
              </div>
            </template>
          </UPopover>

          <!-- Delete Component -->
          <UTooltip text="Delete">
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-trash"
              :disabled="!isEditable"
              aria-label="Delete"
              @click="onDelete"
            />
          </UTooltip>
        </div>
      </div>

      <!-- Component Content (Slots) -->
      <div
        v-if="hasSlots"
        v-show="!collapsed"
        class="ml-7 mt-2"
      >
        <NodeViewContent ref="nodeViewContent" />
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
/* Modern styling using Nuxt UI v4 design tokens */
/* Additional custom styles can be added here if needed */
</style>

<!-- <style lang="postcss">
.prose :where(p):not(:where([class~="not-prose"],[class~="not-prose"] *)) {
  @apply bg-white dark:bg-gray-950/50;
}
</style> -->
