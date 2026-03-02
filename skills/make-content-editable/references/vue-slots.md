# Vue Slots Reference

Source: https://vuejs.org/guide/components/slots

Patterns specific to building Studio-editable MDC components.

---

## Defining Named Slots

```vue
<template>
  <div>
    <h2><slot name="title" mdc-unwrap="p" /></h2>
    <p><slot name="description" mdc-unwrap="p" /></p>
    <div><slot name="body" /></div>
  </div>
</template>
```

---

## Conditional Slots with `v-if="$slots.name"`

Use this for optional decorative wrappers — if the slot is not provided in MDC, the wrapper element is not rendered either.

```vue
<template v-if="$slots.headline" #headline>
  <UBadge>
    <slot name="headline" mdc-unwrap="p" />
  </UBadge>
</template>
```

---

## Passing Slots Through (Slot Forwarding)

When wrapping a third-party component (e.g. Nuxt UI), forward every slot explicitly:

```vue
<template>
  <UPageHero>
    <template #title>
      <slot name="title" mdc-unwrap="p" />
    </template>
    <template #body>
      <slot name="body" />
    </template>
  </UPageHero>
</template>
```

---

## `mdc-unwrap="p"` — When to Use It

MDC wraps every block-level slot content in a `<p>` tag. Remove it when:
- The slot is inside a heading (`<h1>`–`<h6>`)
- The slot is inside an existing `<p>` tag
- You need the text content directly without block wrapper

```vue
<!-- With mdc-unwrap — recommended for headings and paragraph slots -->
<h3><slot name="title" mdc-unwrap="p" /></h3>

<!-- Without mdc-unwrap — for slots that contain rich nested content -->
<div><slot name="body" /></div>
```

---

## Props vs Slots Decision Rule

| Content type | Use |
|---|---|
| Text/rich content an editor changes | `<slot name="..." />` |
| Icon name, URL, boolean, color identifier | `defineProps` |
| Visual variant (color) that differs between sibling instances | `defineProps` with static lookup map |

**Never** use props for content editors need to type. **Never** use slots for configuration values.

---

## `<script setup>` — When to Add It

Only add `<script setup>` when the component needs:
- `defineProps` (icon, color, href, boolean)
- `ref` / `computed` (tab state, toggle logic)

If the component only passes slots through (pure wrapper), no script tag is needed.

---

## Interactive Components (Tabs, Accordions)

Keep interactive state inside the component. Expose one named slot per pane. Use `v-show` (not `v-if`) so all slot content stays mounted — required for Studio's TipTap editor to parse all editable regions.

```vue
<script setup lang="ts">
const activeTab = ref('vue')
const tabs = [
  { id: 'vue', label: 'Vue', icon: 'i-logos-vue' },
  { id: 'react', label: 'React', icon: 'i-logos-react' },
]
</script>

<template>
  <div>
    <div class="flex gap-2">
      <UButton
        v-for="tab in tabs"
        :key="tab.id"
        :variant="activeTab === tab.id ? 'solid' : 'soft'"
        color="neutral"
        :icon="tab.icon"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </UButton>
    </div>
    <div v-show="activeTab === 'vue'"><slot name="vue" /></div>
    <div v-show="activeTab === 'react'"><slot name="react" /></div>
  </div>
</template>
```
