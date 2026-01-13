<script setup lang="ts">
import { ref, computed, unref, onMounted } from 'vue'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { PropType } from 'vue'
import { pascalCase, titleCase, kebabCase, flatCase } from 'scule'
import { buildFormTreeFromProps } from '../../utils/tiptap/props'
import { useStudio } from '../../composables/useStudio'
import { isEmpty } from '../../utils/object'
import type { FormTree } from '../../types'

const props = defineProps({
  node: {
    type: Object as PropType<ProseMirrorNode>,
    required: true,
  },
  updateProps: {
    type: Function as PropType<(props: Record<string, unknown>) => void>,
    required: true,
  },
  hideTitle: {
    type: Boolean,
    default: false,
  },
})

const { host } = useStudio()

const componentTag = computed(() => props.node?.attrs?.tag || props.node?.type?.name)
const componentName = computed(() => pascalCase(componentTag.value))
const componentMeta = computed(() => host.meta.getComponents().find(c => kebabCase(c.name) === kebabCase(componentTag.value)))

// Base form tree
const formTree = ref<FormTree>({})

onMounted(() => {
  const tree = componentMeta.value ? buildFormTreeFromProps(unref(props.node), componentMeta.value) : {}
  formTree.value = normalizePropsTree(tree)
})

// Wrapped form tree for FormSection
const formTreeWithValues = computed(() => {
  if (!formTree.value || Object.keys(formTree.value).length === 0) {
    return null
  }

  return {
    [componentName.value]: {
      id: `#${flatCase(componentName.value)}`,
      title: componentName.value,
      type: 'object',
      children: formTree.value,
    },
  }
})

// Convert form tree to props object for saving
function convertTreeToPropsObject(tree: FormTree): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(tree)) {
    const prop = tree[key]

    // Handle special case for rel attribute
    let value = prop.value
    if (prop.key === 'rel' && value === 'Default value applied') {
      value = 'nofollow,noopener,noreferrer'
    }

    // Only include non-empty values
    if (['boolean', 'number'].includes(typeof value) || !isEmpty(value as Record<string, unknown>)) {
      result[prop.key!] = typeof value === 'string' ? value : JSON.stringify(value)
    }

    // Remove if value equals default
    if (prop.default === value && prop.key) {
      Reflect.deleteProperty(result, prop.key)
    }
  }

  return result
}

// Update a prop value (supports nested paths for objects)
function updateFormTree(updatedTree: FormTree) {
  // Find what changed by comparing trees
  for (const key of Object.keys(updatedTree[componentName.value].children || {})) {
    const updatedProp = updatedTree[componentName.value].children![key]
    const originalProp = formTree.value[key]

    if (!originalProp) continue

    // Check if value changed
    if (JSON.stringify(originalProp.value) !== JSON.stringify(updatedProp.value)) {
      // Update the value in formTree
      updatePropValue(key, updatedProp, originalProp)
    }

    // Check nested children for objects
    if (updatedProp.children && originalProp.children) {
      checkNestedUpdates(key, updatedProp.children, originalProp.children)
    }
  }

  // Update props in editor
  props.updateProps(convertTreeToPropsObject(formTree.value))
}

function updatePropValue(key: string, updatedProp: FormTree[string], originalProp: FormTree[string]) {
  formTree.value[key].value = updatedProp.value

  // Also update children if they exist
  if (updatedProp.children && originalProp.children) {
    for (const childKey of Object.keys(updatedProp.children)) {
      if (originalProp.children[childKey]) {
        originalProp.children[childKey].value = updatedProp.children[childKey].value
      }
    }
  }
}

function checkNestedUpdates(parentKey: string, updatedChildren: FormTree, originalChildren: FormTree) {
  for (const childKey of Object.keys(updatedChildren)) {
    const updatedChild = updatedChildren[childKey]
    const originalChild = originalChildren[childKey]

    if (!originalChild) continue

    if (JSON.stringify(originalChild.value) !== JSON.stringify(updatedChild.value)) {
      // Update nested value
      originalChild.value = updatedChild.value

      // Update parent object value
      if (formTree.value[parentKey].type === 'object') {
        const currentValue = formTree.value[parentKey].value as Record<string, unknown> || {}
        currentValue[childKey] = updatedChild.value
        formTree.value[parentKey].value = { ...currentValue }
      }
    }

    // Recursively check deeper nesting
    if (updatedChild.children && originalChild.children) {
      checkNestedUpdates(parentKey, updatedChild.children, originalChild.children)
    }
  }
}

function normalizePropsTree(tree: FormTree): FormTree {
  // Always add class prop by default
  if (!tree.class) {
    tree.class = {
      id: `#${flatCase(componentName.value)}/class`,
      key: 'class',
      title: 'Class',
      value: props.node?.attrs?.props?.class || '',
      type: 'string',
      default: '',
    }
  }

  // Always remove __tiptapWrap prop by default
  if (tree[':__tiptapWrap']) {
    Reflect.deleteProperty(tree, ':__tiptapWrap')
  }

  return tree
}
</script>

<template>
  <div
    class="p-3 min-w-[400px] max-w-[500px] not-prose overflow-y-auto max-h-[400px] relative"
    @click.stop
  >
    <!-- Header -->
    <div
      v-if="!hideTitle"
      class="text-sm font-mono font-semibold text-highlighted mb-2"
    >
      {{ titleCase(componentName).replace(/^U /, '') }} properties
    </div>

    <!-- Props list -->
    <template v-if="formTreeWithValues">
      <FormSection
        v-for="formItem in Object.values(formTreeWithValues[componentName].children || {}).filter(item => !item.hidden)"
        :key="formItem.id"
        :model-value="formTreeWithValues"
        :form-item="formItem"
        @update:model-value="updateFormTree"
      />
    </template>
  </div>
</template>
