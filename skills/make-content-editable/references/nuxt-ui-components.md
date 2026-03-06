# Nuxt UI Components Reference

Source: https://ui.nuxt.com
MCP tool: `mcp__nuxt-ui__get-component`, `mcp__nuxt-ui__get-component-metadata`

Always call these MCP tools at the start of Step 1 for any Nuxt UI component found inside the component being converted.

---

## UPageHero

**Docs:** https://ui.nuxt.com/docs/components/page-hero
**Category:** page
**Description:** A responsive hero section with badge, title, description, and content areas.

### Slots

| Slot | Purpose |
|---|---|
| `top` | Above the container |
| `header` | Inside container, above headline |
| `headline` | Badge/label area |
| `title` | Main heading |
| `description` | Subheading paragraph |
| `body` | Main content below description |
| `footer` | Below body (e.g. cards, links) |
| `links` | CTA buttons |
| `default` | Illustration (horizontal orientation) |
| `bottom` | Below container |

### Key `:ui` overrides

```vue
<UPageHero
  :ui="{
    container: 'py-24',
    title: 'text-3xl sm:text-4xl font-bold tracking-tight text-highlighted',
    description: 'text-lg text-muted',
    body: 'mx-auto max-w-4xl text-left',
    footer: 'mx-auto max-w-4xl text-left',
  }"
>
```

**Critical:** Default `orientation="vertical"` applies `text-center` to the wrapper, which cascades into `body` and `footer` slots. Always add `text-left` to `body` and `footer` in `:ui` if the original component did not center that content.

### When to use

A component section with: badge/label + main heading + description + content below → wrap with `UPageHero`.

---

## UCard

**Docs:** https://ui.nuxt.com/docs/components/card
**Category:** element
**Description:** Display content in a card with header, body, and footer.

### Slots

| Slot | Purpose |
|---|---|
| `header` | Top section of card |
| `default` | Main body |
| `footer` | Bottom section |

### Props

- `variant`: `"solid"` | `"outline"` | `"soft"` | `"subtle"`
- `ui`: override `root`, `header`, `body`, `footer`

### When to use

Standalone card with icon + title + description → `UCard` (or `UPageCard` for richer link-based cards).

---

## UPageSection

**Docs:** https://ui.nuxt.com/docs/components/page-section
**Category:** page
**Description:** A full-width section with headline, title, description, and a feature grid.

### When to use

Feature/card grid inside a section → `UPageSection`.

---

## UBadge

**Docs:** https://ui.nuxt.com/docs/components/badge
**Common use:** Headline/label badge above a section title.

```vue
<UBadge variant="subtle" size="lg" class="mb-4">
  <template #leading>
    <UIcon name="i-lucide-zap" class="h-4 w-4" />
  </template>
  <slot name="headline" mdc-unwrap="p" />
</UBadge>
```

---

## UButton

**Docs:** https://ui.nuxt.com/docs/components/button
**Common use:** Tab switcher buttons in interactive components.

```vue
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
```

---

## General Wrapping Pattern

When wrapping a Nuxt UI component, pass every slot through explicitly:

```vue
<template>
  <UPageHero :ui="{ ... }">
    <template v-if="$slots.headline" #headline>
      <!-- optional decorative wrapper -->
      <slot name="headline" mdc-unwrap="p" />
    </template>
    <template #title>
      <slot name="title" mdc-unwrap="p" />
    </template>
    <template #description>
      <slot name="description" mdc-unwrap="p" />
    </template>
    <template #body>
      <slot name="body" />
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </UPageHero>
</template>
```

- Use `v-if="$slots.slotName"` on optional decorative wrappers (badge, icon containers).
- Do not add extra wrapper divs to reset styles — use `:ui` overrides instead.
