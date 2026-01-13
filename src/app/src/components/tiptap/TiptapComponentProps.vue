<script setup lang="ts">
import { ref, computed, unref, onMounted } from 'vue'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { PropType } from 'vue'
import { pascalCase, titleCase, kebabCase, flatCase } from 'scule'
import { buildFormTreeFromProps } from '../../utils/tiptap/props'
import { useStudio } from '../../composables/useStudio'
import { isEmpty } from '../../utils/object'
import type { FormTree } from '../../types'
import { applyValuesToFormTree, getUpdatedTreeItem } from '../../utils/form'

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

// Base form tree without values
const formTree = ref<FormTree>({})

onMounted(() => {
  const tree = componentMeta.value ? buildFormTreeFromProps(unref(props.node), componentMeta.value) : {}
  formTree.value = normalizePropsTree(tree)
})

// Handles updates to formTreeWithValues and updates the props in editor
const formTreeWithValues = computed({
  get: () => {
    if (!formTree.value || Object.keys(formTree.value).length === 0) {
      return null
    }

    const wrappedTree: FormTree = {
      [componentName.value]: {
        id: `#${flatCase(componentName.value)}`,
        title: componentName.value,
        type: 'object',
        children: formTree.value,
      },
    }

    // Apply current values from node props
    const currentValues: Record<string, unknown> = {}
    for (const key of Object.keys(formTree.value)) {
      const prop = formTree.value[key]
      currentValues[key] = prop.value
    }

    return applyValuesToFormTree(wrappedTree, { [componentName.value]: currentValues })
  },
  set: (newFormTree) => {
    // Unwrap the component node to get the actual children
    const unwrappedTree = newFormTree?.[componentName.value]?.children
    if (!unwrappedTree) {
      return
    }

    const updatedItem = getUpdatedTreeItem(formTree.value, unwrappedTree)
    if (!updatedItem) {
      return
    }

    // Update the base form tree value
    const pathSegments = updatedItem.id.split('/')
    const updatedKey = pathSegments[pathSegments.length - 1]
    if (formTree.value[updatedKey]) {
      formTree.value[updatedKey].value = updatedItem.value
    }

    // Convert to props object and update
    const propsObject = convertTreeToPropsObject(formTree.value)
    props.updateProps(propsObject)
  },
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
        v-model="formTreeWithValues"
        :form-item="formItem"
      />
    </template>
  </div>
</template>
