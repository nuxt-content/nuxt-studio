# Nuxt Components Reference

Source: https://nuxt.com/docs/guide/directory-structure/components
Vue slots: https://vuejs.org/guide/components/slots

Nuxt-specific patterns for component props and slots, relevant when building Studio-editable MDC components.

---

## Component Auto-Discovery

Nuxt automatically imports components from the `app/components/` (Nuxt 4) or `components/` (Nuxt 3) directory. No manual registration is required. Components are named based on their path:

- `components/Landing/Hero.vue` → `<LandingHero />`
- `components/LandingCard.vue` → `<LandingCard />`

Components must be globally available (auto-imported) to be discovered by Nuxt Studio. You can control which components appear in Studio's component picker via `meta.components.include` / `meta.components.exclude` in `nuxt.config.ts`.

---

## Defining Props

Use `defineProps` with TypeScript generics in `<script setup>`:

```vue
<script setup lang="ts">
const props = defineProps<{
  icon?: string
  color?: 'primary' | 'green' | 'purple'
  to?: string
  external?: boolean
}>()
</script>
```

Props appear as a **form UI** in Studio's sidebar — not editable inline in the TipTap editor.

**Use props for**: icon names, URLs, color variants, boolean flags, numeric values.
**Use slots for**: text content, headings, descriptions, body text, rich/editable content.

---

## Default Slot

A component with a single `<slot />` (no `name`) uses the **default slot**. Content between the component tags in MDC goes to the default slot automatically:

```mdc
::my-card
This content goes to the default slot.
::
```

`#default` is also a valid explicit identifier for the same slot. For components with only one content area, both forms are equivalent:

```mdc
::my-card
#default
This content also goes to the default slot.
::
```

Vue component:

```vue
<template>
  <div class="card">
    <slot />
  </div>
</template>
```

---

## Named Slots

Use the `name` attribute on `<slot>` to define named slots:

```vue
<template>
  <div>
    <h2><slot name="title" mdc-unwrap="p" /></h2>
    <p><slot name="description" mdc-unwrap="p" /></p>
    <div><slot name="body" /></div>
  </div>
</template>
```

Target named slots in MDC with `#slotName`:

```mdc
::my-component
#title
My Heading

#description
A short description here.

#body
Rich content with **markdown** and [links](/page).
::
```

---

## `#default` vs Named Slots in MDC

| Scenario | Recommendation |
|---|---|
| Component has only one content area | `#default` or unnamed content — both work |
| Component has multiple content areas | Use named slots (`#title`, `#description`, `#body`) |
| Outer component wraps children that have `#title`/`#description` | Use distinct names (`#body`, `#footer`) — `#default` can cause MDC parse errors |

---

## Slot Fallback Content

Define fallback content inside the `<slot>` tag — rendered when the parent provides nothing for that slot:

```vue
<template>
  <slot name="title">Untitled</slot>
</template>
```

---

## Conditional Slots with `$slots`

Check `$slots.slotName` to conditionally render a wrapper element only when the slot is provided:

```vue
<template>
  <UBadge v-if="$slots.headline">
    <slot name="headline" mdc-unwrap="p" />
  </UBadge>
</template>
```

This prevents empty wrapper elements from rendering when the slot is omitted in MDC.

---

## Props vs Slots in Studio

| Content type | Mechanism | Edited in Studio via |
|---|---|---|
| Text, headings, rich content | `<slot name="..." />` | TipTap inline editor |
| Icon name, URL, color, boolean | `defineProps` | Sidebar form UI |

Never use a prop for content an editor needs to type. Never use a slot for a configuration value.
