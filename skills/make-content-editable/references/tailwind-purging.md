# Tailwind CSS Purging Reference

Source: https://tailwindcss.com/docs/content-configuration

---

## The Problem: Dynamic Class Strings Are Purged

Tailwind's build process (via its content scanning) only keeps CSS classes that appear as **complete literal strings** in source files. If you construct a class name at runtime, Tailwind never sees the full string and removes it from the final CSS bundle.

**This will NOT work:**

```vue
<!-- WRONG — Tailwind cannot see these full class names at build time -->
<div :class="`bg-${color}-500/10 text-${color}-500`" />
```

At build time, Tailwind scans the file and finds only `bg-`, `-500/10`, `text-`, `-500` — none of which are valid utility classes. The generated CSS will not contain any of the needed color utilities, and the styles will be invisible in production.

---

## The Solution: Static Lookup Maps

Every class string must appear **in full, as a literal** somewhere in the source file. A static lookup map satisfies this requirement:

```vue
<script setup lang="ts">
const props = defineProps<{
  color?: 'primary' | 'purple' | 'green' | 'blue'
}>()

// Every class string is a complete literal — Tailwind can see them all
const colorMap = {
  primary: { bg: 'bg-primary-500/10', text: 'text-primary-500' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-500'  },
  green:   { bg: 'bg-green-500/10',   text: 'text-green-500'   },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-500'    },
}

const colors = computed(() => colorMap[props.color ?? 'primary'])
</script>

<template>
  <div :class="colors.bg">
    <UIcon :name="icon" :class="colors.text" />
  </div>
</template>
```

Tailwind scans the file, finds `bg-primary-500/10`, `text-primary-500`, etc. as full strings in the map, and includes them in the CSS bundle.

---

## Full Color Map for Landing Components

This project uses the following color map across `LandingCard` and similar components. Copy and extend as needed — always add the full literal class strings:

```ts
const colorMap = {
  primary: { bg: 'bg-primary-500/10', text: 'text-primary-500' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-500'  },
  green:   { bg: 'bg-green-500/10',   text: 'text-green-500'   },
  neutral: { bg: 'bg-neutral-500/10', text: 'text-neutral-500' },
  red:     { bg: 'bg-red-500/10',     text: 'text-red-500'     },
  yellow:  { bg: 'bg-yellow-500/10',  text: 'text-yellow-500'  },
  blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-500'    },
  orange:  { bg: 'bg-orange-500/10',  text: 'text-orange-500'  },
  pink:    { bg: 'bg-pink-500/10',    text: 'text-pink-500'    },
  teal:    { bg: 'bg-teal-500/10',    text: 'text-teal-500'    },
  cyan:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-500'    },
}
```

---

## When to Add a Color Prop

Add a `color` prop whenever **sibling instances of the same component differ visually**. Check ALL sibling instances in the markdown file — colors often differ between cards, features, or list items. If even one sibling has a different color, add a `color` prop with a lookup map for every color actually used across all siblings.
