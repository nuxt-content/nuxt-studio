# Vue Components

Patterns for Vue 3 components using Composition API with `<script setup>`.

## Quick Reference

| Pattern               | Syntax                                                          |
| --------------------- | --------------------------------------------------------------- |
| Props (destructured)  | `const { name = 'default' } = defineProps<{ name?: string }>()` |
| Props (template-only) | `defineProps<{ name: string }>()`                               |
| Emits                 | `const emit = defineEmits<{ click: [id: number] }>()`           |
| Two-way binding       | `const model = defineModel<string>()`                           |
| Slots shorthand       | `<template #header>` not `<template v-slot:header>`             |

## Naming

**Files:** PascalCase (`UserProfile.vue`) OR kebab-case (`user-profile.vue`) - be consistent

**Component names in code:** Always PascalCase

**Composition:** General → Specific: `SearchButtonClear.vue` not `ClearSearchButton.vue`

## Props

**Destructure with defaults (Vue 3.5+)** when used in script or need defaults:

```ts
const { count = 0, message = 'Hello' } = defineProps<{
  count?: number
  message?: string
  required: boolean
}>()

// Use directly - maintains reactivity
console.log(count + 1)

// ⚠️ When passing to watchers/functions, wrap in getter:
watch(() => count, (newVal) => { ... }) // ✅ Correct
watch(count, (newVal) => { ... })        // ❌ Won't work
```

**Non-destructured** only if props ONLY used in template:

```ts
defineProps<{ count: number }>()
// Template: {{ count }}
```

**Same-name shorthand (Vue 3.4+):** `:count` instead of `:count="count"`

```vue
<MyComponent :count :user :items />
<!-- Same as: :count="count" :user="user" :items="items" -->
```

[Reactive destructuring docs](https://vuejs.org/guide/components/props#reactive-props-destructure)

## Emits

Type-safe event definitions:

```ts
const emit = defineEmits<{
  update: [id: number, value: string] // multiple args
  close: [] // no args
}>()

// Usage
emit('update', 123, 'new value')
emit('close')
```

**Template syntax:** kebab-case (`@update-item`) vs camelCase in script (`updateItem`)

## Slots

**Always use shorthand:** `<template #header>` not `<template v-slot:header>`

**Always explicit `<template>` tags** for all slots

```vue
<template>
  <Card>
    <template #header>
      <h2>Title</h2>
    </template>
    <template #default>
      Content
    </template>
  </Card>
</template>
```

## defineModel() - Two-Way Binding

Replaces manual `modelValue` prop + `update:modelValue` emit.

### Basic

```vue
<script setup lang="ts">
const title = defineModel<string>()
</script>

<template>
  <input v-model="title">
</template>
```

### With Options

```vue
<script setup lang="ts">
const [title, modifiers] = defineModel<string>({
  default: 'default value',
  required: true,
  get: (value) => value.trim(),
  set: (value) => {
    if (modifiers.capitalize) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  },
})
</script>
```

**⚠️ Warning:** When using `default` without parent providing a value, parent and child can de-sync (parent `undefined`, child has default). Always provide matching defaults in parent or make prop required.

**Prevent double-emit with `required: true`:**

```ts
// ❌ Without required - emits twice (undefined then value)
const model = defineModel<Item>()

// ✅ With required - single emit
const model = defineModel<Item>({ required: true })
```

Use `required: true` when the model should always have a value to avoid the double-emit issue during initialization.

### Multiple Models

Default assumes `modelValue` prop. For multiple bindings, use explicit names:

```vue
<script setup lang="ts">
const firstName = defineModel<string>('firstName')
const age = defineModel<number>('age')
</script>

<!-- Usage -->
<UserForm v-model:first-name="user.firstName" v-model:age="user.age" />
```

[v-model modifiers docs](https://vuejs.org/guide/components/v-model#handling-v-model-modifiers)

## Reusable Templates

For typed, scoped template snippets within a component:

```vue
<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'

const [DefineItem, UseItem] = createReusableTemplate<{
  item: SearchItem
  icon: string
  color?: 'red' | 'green' | 'blue'
}>()
</script>

<template>
  <DefineItem v-slot="{ item, icon, color }">
    <div :class="color">
      <Icon :name="icon" />
      {{ item.name }}
    </div>
  </DefineItem>

  <!-- Reuse multiple times -->
  <UseItem v-for="item in items" :key="item.id" :item :icon="getIcon(item)" />
</template>
```

## Template Refs (Vue 3.5+)

Use `useTemplateRef()` for type-safe template references with IDE support:

```vue
<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

const input = useTemplateRef<HTMLInputElement>('my-input')

onMounted(() => {
  input.value?.focus()
})
</script>

<template>
  <input ref="my-input">
</template>
```

**Benefits over `ref()`:**

- Type-safe with generics
- Better IDE autocomplete and refactoring
- Explicit ref name as string literal

**Dynamic refs:**

```vue
<script setup lang="ts">
const items = ref(['a', 'b', 'c'])
const itemRefs = useTemplateRef<HTMLElement>('item')

// Access refs after mount
onMounted(() => {
  console.log(itemRefs.value) // Array of elements
})
</script>

<template>
  <div v-for="item in items" :key="item" ref="item">
    {{ item }}
  </div>
</template>
```

**Component refs with generics:**

For generic components, use `ComponentExposed` from `vue-component-type-helpers`:

```ts
import type { ComponentExposed } from 'vue-component-type-helpers'
import MyGenericComponent from './MyGenericComponent.vue'

// Get exposed methods/properties with correct generic types
const compRef = useTemplateRef<ComponentExposed<typeof MyGenericComponent>>('comp')

onMounted(() => {
  compRef.value?.someExposedMethod() // Typed!
})
```

Install: `pnpm add -D vue-component-type-helpers`

## SSR Hydration (Vue 3.5+)

**Suppress hydration mismatches** for values that differ between server/client:

```vue
<template>
  <!-- Client-side only values -->
  <span data-allow-mismatch>{{ new Date().toLocaleString() }}</span>

  <!-- Specific mismatch types -->
  <span data-allow-mismatch="text">{{ timestamp }}</span>
  <span data-allow-mismatch="children">
    <ClientOnly>...</ClientOnly>
  </span>
  <span data-allow-mismatch="style">...</span>
  <span data-allow-mismatch="class">...</span>
  <span data-allow-mismatch="attribute">...</span>
</template>
```

**Generate SSR-stable IDs:**

```vue
<script setup lang="ts">
import { useId } from 'vue'

const id = useId() // Stable across server/client renders
</script>

<template>
  <label :for="id">Name</label>
  <input :id="id">
</template>
```

## Deferred Teleport (Vue 3.5+)

Teleport to elements rendered later in the same cycle:

```vue
<template>
  <!-- This renders first -->
  <Teleport defer to="#late-div">
    <span>Deferred content</span>
  </Teleport>

  <!-- This renders after, but Teleport waits -->
  <div id="late-div"></div>
</template>
```

Without `defer`, teleport to `#late-div` would fail since it doesn't exist yet.

## Common Mistakes

**Using `const props =` with destructured values:**

```ts
// ❌ Wrong
const props = defineProps<{ count: number }>()
const { count } = props // Loses reactivity
```

**Forgetting TypeScript types:**

```ts
// ❌ Wrong
const emit = defineEmits(['update'])

// ✅ Correct
const emit = defineEmits<{ update: [id: number] }>()
```

**Components >300 lines:** Split into smaller components or extract logic to composables
