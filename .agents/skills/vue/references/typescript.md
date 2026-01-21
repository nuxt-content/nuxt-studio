# Vue TypeScript Patterns

TypeScript-specific patterns for Vue 3 development.

## Provide/Inject Types

Use `InjectionKey` for type-safe dependency injection:

```ts
import type { InjectionKey } from 'vue'
import type { User } from './types'

// Define typed key
export const UserKey: InjectionKey<User> = Symbol('user')

// Provider component
const user = ref<User>({ id: 1, name: 'John' })
provide(UserKey, user)

// Consumer component
const user = inject(UserKey) // Ref<User> | undefined
const user = inject(UserKey)! // Ref<User> (assert non-null)
```

**With default value:**

```ts
const user = inject(UserKey, ref({ id: 0, name: 'Guest' }))
// Type: Ref<User> (no undefined)
```

## vue-tsc Strict Templates

Enable stricter template type checking:

```bash
# Check templates with strict mode
vue-tsc --noEmit --strict-templates
```

Catches template errors like:

- Accessing non-existent properties
- Wrong prop types
- Missing required props

## tsconfig Settings

**Required for Vue 3:**

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "verbatimModuleSyntax": true,
    "strict": true,
    "jsx": "preserve"
  }
}
```

**`moduleResolution: "bundler"`** - Matches Vite/webpack resolution. Avoids `.js` extension issues.

**`verbatimModuleSyntax: true`** - Enforces explicit `type` imports:

```ts
// ❌ May cause issues with bundlers
import { User } from './types'

// ✅ Explicit type import
import type { User } from './types'
```

## Component Type Helpers

**Extract props type from component:**

```ts
import type { ComponentProps, ComponentSlots, ComponentEmits } from 'vue-component-type-helpers'
import MyComponent from './MyComponent.vue'

type Props = ComponentProps<typeof MyComponent>
type Slots = ComponentSlots<typeof MyComponent>
type Emits = ComponentEmits<typeof MyComponent>
```

**Extract exposed methods:**

```ts
import type { ComponentExposed } from 'vue-component-type-helpers'

type Exposed = ComponentExposed<typeof MyComponent>
```

## Generic Components

Define generic components with typed slots:

```vue
<script setup lang="ts" generic="T extends { id: string }">
defineProps<{
  items: T[]
}>()

defineSlots<{
  default: (props: { item: T }) => any
}>()
</script>

<template>
  <div v-for="item in items" :key="item.id">
    <slot :item="item" />
  </div>
</template>
```

## Ref Type Narrowing

Handle ref type narrowing correctly:

```ts
const maybeUser = ref<User | null>(null)

// ❌ TypeScript still sees User | null
if (maybeUser.value) {
  maybeUser.value.name // Error: possibly null
}

// ✅ Use computed or extract value
const userName = computed(() => maybeUser.value?.name ?? 'Guest')

// ✅ Or guard in same expression
maybeUser.value && maybeUser.value.name
```

## Event Handler Types

Type event handlers correctly:

```ts
// DOM events
const onClick = (e: MouseEvent) => { ... }
const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  console.log(target.value)
}

// Component emits
const onUpdate = (value: string) => { ... }
```

## Common Mistakes

**Forgetting to import types explicitly:**

```ts
// ❌ Runtime import of type-only
import { User } from './types'

// ✅ Type-only import
import type { User } from './types'
```

**Not using `as const` for literal types:**

```ts
// ❌ Type is string[]
const variants = ['primary', 'secondary']

// ✅ Type is readonly ['primary', 'secondary']
const variants = ['primary', 'secondary'] as const
```
