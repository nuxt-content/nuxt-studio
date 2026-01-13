<script setup lang="ts">
import { ref, computed, unref, onMounted } from 'vue'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { PropType } from 'vue'
import { pascalCase, titleCase, kebabCase, flatCase } from 'scule'
import { buildFormTreeFromProps } from '../../utils/tiptap/props'
import { useStudio } from '../../composables/useStudio'
import { isEmpty } from '../../utils/object'
import type { FormTree } from '../../types'
import InputWrapper from '../form/input/InputWrapper.vue'

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

// Form tree state
const formTree = ref<FormTree>({})

const componentTag = computed(() => props.node?.attrs?.tag || props.node?.type?.name)
const componentName = computed(() => pascalCase(componentTag.value))
const componentMeta = computed(() => host.meta.getComponents().find(c => kebabCase(c.name) === kebabCase(componentTag.value)))

onMounted(() => {
  const tree = componentMeta.value ? buildFormTreeFromProps(unref(props.node), componentMeta.value) : {}
  formTree.value = normalizePropsTree(tree)
})

// Convert form tree to props object for saving
const propsObject = computed(() => {
  const result: Record<string, unknown> = {}

  for (const key of Object.keys(formTree.value)) {
    const prop = formTree.value[key]

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
})

// Update a prop value
function updateProp(key: string, value: unknown) {
  if (!formTree.value[key]) return

  formTree.value[key].value = value
  props.updateProps(propsObject.value)
}

// Get visible props
const visibleProps = computed(() =>
  Object.entries(formTree.value).filter(([_, prop]) => !prop.hidden),
)

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
    <div class="space-y-2">
      <UFormField
        v-for="[key, prop] in visibleProps"
        :key="key"
        :name="prop.key"
        :label="prop.title"
        orientation="horizontal"
        :ui="{
          label: 'text-xs font-medium tracking-tight',
        }"
      >
        <InputWrapper
          class="w-full"
          :model-value="prop.value"
          :form-item="prop"
          @update:model-value="updateProp(key, $event)"
        />
      </UFormField>
    </div>
  </div>
</template>
