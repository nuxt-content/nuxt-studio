# Vue Composables

Reusable functions encapsulating stateful logic using Composition API.

## Core Rules

1. **VueUse first** - check [vueuse.org](https://vueuse.org) before writing custom
2. **No async composables** - lose lifecycle context when awaited in other composables
3. **Top-level only** - never call in event handlers, conditionals, or loops
4. **readonly() exports** - protect internal state from external mutation
5. **useState() for SSR** - use Nuxt's `useState()` not global refs

## Quick Reference

| Pattern   | Example                                          |
| --------- | ------------------------------------------------ |
| Naming    | `useAuth`, `useCounter`, `useDebounce`           |
| State     | `const count = ref(0)`                           |
| Computed  | `const double = computed(() => count.value * 2)` |
| Lifecycle | `onMounted(() => ...)`, `onUnmounted(() => ...)` |
| Return    | `return { count, increment }`                    |

## Structure

```ts
// composables/useCounter.ts
import { readonly, ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initialValue }

  return {
    count: readonly(count), // readonly if shouldn't be mutated
    increment,
    decrement,
    reset,
  }
}
```

## Naming

**Always prefix with `use`:** `useAuth`, `useLocalStorage`, `useDebounce`

**File = function:** `useAuth.ts` exports `useAuth`

## Best Practices

**Do:**

- Return object with named properties (destructuring-friendly)
- Accept options object for configuration
- Use `readonly()` for state that shouldn't mutate
- Handle cleanup (`onUnmounted`, `onScopeDispose`)
- Add JSDoc for complex functions

## Lifecycle

Hooks execute in component context:

```ts
export function useEventListener(target: EventTarget, event: string, handler: Function) {
  onMounted(() => target.addEventListener(event, handler))
  onUnmounted(() => target.removeEventListener(event, handler))
}
```

**Watcher cleanup (Vue 3.5+):**

```ts
import { watch, onWatcherCleanup } from 'vue'

export function usePolling(url: Ref<string>) {
  watch(url, (newUrl) => {
    const interval = setInterval(() => {
      fetch(newUrl).then(/* ... */)
    }, 1000)

    // Cleanup when watcher re-runs or stops
    onWatcherCleanup(() => {
      clearInterval(interval)
    })
  })
}
```

**Benefits of `onWatcherCleanup()`:**

- Cleaner than returning cleanup functions
- Works with async watchers
- Can be called multiple times in same watcher

## Async Pattern

```ts
export function useAsyncData<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    }
    catch (e) {
      error.value = e as Error
    }
    finally {
      loading.value = false
    }
  }

  execute()
  return { data, error, loading, refetch: execute }
}
```

**Data fetching:** Prefer Pinia Colada queries over custom composables.

## VueUse

> For VueUse composable reference, use the `vueuse` skill.

Check VueUse before writing custom composables - most patterns already implemented.

> **For Nuxt-specific composables** (useFetch, useRequestURL): see `nuxt` skill nuxt-composables.md

## Advanced Patterns

### Singleton Composable

Share state across all components using the same composable:

```ts
import { createSharedComposable } from '@vueuse/core'

function useMapControlsBase() {
  const mapInstance = ref<Map | null>(null)
  const flyTo = (coords: [number, number]) => mapInstance.value?.flyTo(coords)
  return { mapInstance, flyTo }
}

export const useMapControls = createSharedComposable(useMapControlsBase)
```

### Cancellable Fetch with AbortController

```ts
export function useSearch() {
  let abortController: AbortController | null = null

  watch(query, async (newQuery) => {
    abortController?.abort()
    abortController = new AbortController()

    try {
      const data = await $fetch('/api/search', {
        query: { q: newQuery },
        signal: abortController.signal,
      })
    }
    catch (e) {
      if (e.name !== 'AbortError')
        throw e
    }
  })
}
```

### Step-Based State Machine

```ts
export function useSendFlow() {
  const step = ref<'input' | 'confirm' | 'success'>('input')
  const amount = ref('')

  const next = () => {
    if (step.value === 'input')
      step.value = 'confirm'
    else if (step.value === 'confirm')
      step.value = 'success'
  }

  return { step, amount, next }
}
```

### Client-Only Guards

```ts
export function useUserLocation() {
  const location = ref<GeolocationPosition | null>(null)

  if (import.meta.client) {
    navigator.geolocation.getCurrentPosition(pos => location.value = pos)
  }

  return { location }
}
```

### Custom Element Composables (Vue 3.5+)

For custom element components, use built-in helpers:

```ts
import { useHost, useShadowRoot } from 'vue'

export function useCustomElement() {
  const host = useHost() // Host element reference
  const shadowRoot = useShadowRoot() // Shadow DOM root

  onMounted(() => {
    console.log('Host:', host)
    console.log('Shadow:', shadowRoot)
  })

  return { host, shadowRoot }
}
```

**Available in:**

- Components using `<script setup>` in custom elements
- Access via `this.$host` in Options API

### Auto-Save with Debounce

```ts
export function useAutoSave(content: Ref<string>) {
  const hasChanges = ref(false)

  const save = useDebounceFn(async () => {
    if (!hasChanges.value)
      return
    await $fetch('/api/save', { method: 'POST', body: { content: content.value } })
    hasChanges.value = false
  }, 1000)

  watch(content, () => {
    hasChanges.value = true
    save()
  })

  return { hasChanges }
}
```

### Tagged Logger

```ts
import { consola } from 'consola'

export function useSearch() {
  const logger = consola.withTag('search')

  watch(query, (q) => {
    logger.info('Query changed:', q)
  })
}
```

## Reactivity Gotchas

### Ref Unwrapping in Reactive

Refs auto-unwrap in `reactive()` objects but **NOT** in arrays, Maps, or Sets:

```ts
// ✅ Object - auto unwraps
const state = reactive({ count: ref(0) })
state.count++ // No .value needed

// ❌ Array - NO unwrapping
const arr = reactive([ref(1)])
arr[0].value // Need .value!

// ❌ Map/Set - NO unwrapping
const map = reactive(new Map([['key', ref(1)]]))
map.get('key').value // Need .value!
```

### watchEffect Conditional Tracking

Dependencies inside conditional branches are **not tracked** when condition is false:

```ts
// ❌ Wrong - dep not tracked when condition false
watchEffect(() => {
  if (condition.value) {
    console.log(dep.value) // Only tracked when condition=true
  }
})

// ✅ Correct - use explicit watch for conditional deps
watch([condition, dep], ([cond, d]) => {
  if (cond) console.log(d)
})
```

### Cleanup Patterns

**For keep-alive components** - use `onDeactivated`:

```ts
export function usePolling() {
  let interval: NodeJS.Timeout

  onMounted(() => { interval = setInterval(poll, 5000) })
  onUnmounted(() => clearInterval(interval))
  onDeactivated(() => clearInterval(interval)) // Pause when deactivated
  onActivated(() => { interval = setInterval(poll, 5000) }) // Resume
}
```

**For scope-aware cleanup** - use `tryOnScopeDispose` from VueUse:

```ts
import { tryOnScopeDispose } from '@vueuse/core'

export function useEventSource(url: string) {
  const source = new EventSource(url)

  // Cleans up when effect scope disposes (component unmount, watcher stop)
  tryOnScopeDispose(() => source.close())

  return { source }
}
```

## Common Mistakes

**Not using `readonly()` for internal state:**

```ts
// ❌ Wrong - exposes mutable ref
return { count }

// ✅ Correct - prevents external mutation
return { count: readonly(count) }
```

**Missing cleanup:**

```ts
// ❌ Wrong - listener never removed
onMounted(() => target.addEventListener('click', handler))

// ✅ Correct - cleanup on unmount
onMounted(() => target.addEventListener('click', handler))
onUnmounted(() => target.removeEventListener('click', handler))
```
