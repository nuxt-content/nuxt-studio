---
name: nuxt-ui
description: Use when building styled UI with @nuxt/ui v4 components (Button, Modal, Form, Table, etc.) - provides ready-to-use components with Tailwind Variants theming. Use vue skill for raw component patterns, reka-ui for headless primitives.
license: MIT
---

# Nuxt UI v4

Component library for Vue 3 and Nuxt 4+ built on Reka UI (headless) + Tailwind CSS v4 + Tailwind Variants.

**Current stable version:** v4.3.0 (December 2025)

## When to Use

- Installing/configuring @nuxt/ui
- Using UI components (Button, Card, Table, Form, etc.)
- Customizing theme (colors, variants, CSS variables)
- Building forms with validation
- Using overlays (Modal, Toast, CommandPalette)
- Working with composables (useToast, useOverlay)

**For Vue component patterns:** use `vue` skill
**For Nuxt routing/server:** use `nuxt` skill

## Available Guidance

| File                                                         | Topics                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| **[references/installation.md](references/installation.md)** | Nuxt/Vue setup, pnpm gotchas, UApp wrapper, module options, prefix, tree-shaking |
| **[references/theming.md](references/theming.md)**           | Semantic colors, CSS variables, app.config.ts, Tailwind Variants                 |
| **[references/components.md](references/components.md)**     | Component index by category (125+ components)                                    |
| **components/\*.md**                                         | Per-component details (button.md, modal.md, etc.)                                |
| **[references/forms.md](references/forms.md)**               | Form components, validation (Zod/Valibot), useFormField                          |
| **[references/overlays.md](references/overlays.md)**         | Toast, Modal, Slideover, Drawer, CommandPalette                                  |
| **[references/composables.md](references/composables.md)**   | useToast, useOverlay, defineShortcuts, useScrollspy                              |

## Usage Pattern

**Load based on context:**

- Installing Nuxt UI? → [references/installation.md](references/installation.md)
- Customizing theme? → [references/theming.md](references/theming.md)
- Component index → [references/components.md](references/components.md)
- Specific component → [components/button.md](components/button.md), [components/modal.md](components/modal.md), etc.
- Building forms? → [references/forms.md](references/forms.md)
- Using overlays? → [references/overlays.md](references/overlays.md)
- Using composables? → [references/composables.md](references/composables.md)

**DO NOT read all files at once.** Load based on context.

## Key Concepts

| Concept           | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| UApp              | Required wrapper component for Toast, Tooltip, overlays    |
| Tailwind Variants | Type-safe styling with slots, variants, compoundVariants   |
| Semantic Colors   | primary, secondary, success, error, warning, info, neutral |
| Reka UI           | Headless component primitives (accessibility built-in)     |

> For headless component primitives (API details, accessibility patterns, asChild): read the **reka-ui** skill

## Quick Reference

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* assets/css/main.css */
@import 'tailwindcss';
@import '@nuxt/ui';
```

```vue
<!-- app.vue - UApp wrapper required -->
<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>
```

## Resources

- [Nuxt UI Docs](https://ui.nuxt.com)
- [Component Reference](https://ui.nuxt.com/components)
- [Theme Customization](https://ui.nuxt.com/getting-started/theme)

---

_Token efficiency: Main skill ~300 tokens, each sub-file ~800-1200 tokens_
