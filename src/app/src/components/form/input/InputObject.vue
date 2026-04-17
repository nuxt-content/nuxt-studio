<script setup lang="ts">
import { titleCase } from 'scule'
import type { FormTree, FormItem } from '../../../types'
import type { PropType } from 'vue'
import { computed } from 'vue'

const props = defineProps({
  formItem: {
    type: Object as PropType<FormItem>,
    required: true,
  },
  children: {
    type: Object as PropType<FormTree>,
    default: null,
  },
  depth: {
    type: Number,
    default: 0,
  },
})

const model = defineModel({
  type: Object as PropType<Record<string, unknown>>,
  default: (): Record<string, unknown> => ({}),
})

/**
 * FormTree keys use `:prop` for non-string props; parsed MDC / JSON values usually use plain `prop`.
 */
function collectKeyAliases(treeKey: string, child: FormItem): string[] {
  const fromChild = child.key ?? treeKey
  const variants = new Set<string>()
  for (const k of [treeKey, fromChild]) {
    if (!k) {
      continue
    }
    variants.add(k)
    if (k.startsWith(':')) {
      variants.add(k.slice(1))
    }
    else {
      variants.add(`:${k}`)
    }
  }
  return [...variants]
}

function readChildValue(
  model: Record<string, unknown> | undefined,
  treeKey: string,
  child: FormItem,
): unknown {
  if (!model) {
    return child.default ?? getDefault(child.type)
  }
  for (const alias of collectKeyAliases(treeKey, child)) {
    if (alias in model) {
      return model[alias]
    }
  }
  return child.default ?? getDefault(child.type)
}

function pickStorageKey(treeKey: string, child: FormItem, current: Record<string, unknown>): string {
  for (const alias of collectKeyAliases(treeKey, child)) {
    if (alias in current) {
      return alias
    }
  }
  const raw = child.key ?? treeKey
  return raw.startsWith(':') ? raw.slice(1) : raw
}

const entries = computed(() => {
  if (!props.children) return []

  return Object.entries(props.children)
    .filter(([_, child]) => !child.hidden)
    .map(([treeKey, child]) => {
      const value = readChildValue(model.value, treeKey, child)

      return {
        key: treeKey,
        label: titleCase(child.title || treeKey),
        value,
        formItem: child,
      }
    })
})

function updateValue(treeKey: string, child: FormItem, value: unknown) {
  const next = { ...model.value }
  const storageKey = pickStorageKey(treeKey, child, next)
  for (const alias of collectKeyAliases(treeKey, child)) {
    if (alias !== storageKey && alias in next) {
      Reflect.deleteProperty(next, alias)
    }
  }
  next[storageKey] = value
  model.value = next
}

function getDefault(type: string) {
  switch (type) {
    case 'array':
      return []
    case 'object':
      return {}
    case 'boolean':
      return false
    case 'number':
      return 0
    default:
      return ''
  }
}
</script>

<template>
  <div
    class="space-y-2"
    :class="depth > 1 ? 'border-l border-muted pl-3' : ''"
  >
    <template v-if="entries.length">
      <UFormField
        v-for="entry in entries"
        :key="entry.key"
        :name="entry.key"
        :label="entry.label"
        :ui="{
          label: 'text-xs font-medium tracking-tight',
        }"
      >
        <InputWrapper
          :model-value="entry.value"
          :form-item="entry.formItem"
          :depth="depth + 1"
          @update:model-value="updateValue(entry.key, entry.formItem, $event)"
        />
      </UFormField>
    </template>

    <div
      v-else
      class="flex flex-col items-center justify-center py-6 rounded-md border border-dashed border-muted"
    >
      <UIcon
        name="i-lucide-box"
        class="size-5 text-muted mb-2"
      />
      <p class="text-xs text-muted">
        {{ $t('studio.form.object.noProperties') }}
      </p>
    </div>
  </div>
</template>
