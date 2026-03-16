---
name: make-content-editable
description: Converts hardcoded Vue components in a Nuxt Content markdown file into slot-based, Studio-editable MDC components. Use when a user wants their Nuxt Content page to be visually editable in Nuxt Studio's TipTap editor.
---

# Make Content Editable

Convert hardcoded Vue components found in a markdown file into slot-based, Nuxt Studio-editable MDC components.

## References

Consult these files as you work through each step:

| File | When to consult |
|---|---|
| [`references/vue-slots.md`](references/vue-slots.md) | Slot naming conventions, props vs slots, mdc-unwrap, interactive components |
| [`references/mdc-syntax.md`](references/mdc-syntax.md) | Colon depth, indentation, slot ordering, parse errors |
| [`references/nuxt-studio.md`](references/nuxt-studio.md) | Why slots = editable regions, v-show rule |
| [`references/nuxt-components.md`](references/nuxt-components.md) | Nuxt component auto-discovery, props, default/named slots |
| [`references/nuxt-ui-components.md`](references/nuxt-ui-components.md) | UPageHero/UCard slot API, `:ui` overrides, text-center quirk |
| [`references/tailwind-purging.md`](references/tailwind-purging.md) | Static lookup maps for color props |

---

## Goal

Produce a 1:1 visual match of every original rendered component, with all content moved into MDC slots and props so it is editable in Nuxt Studio's TipTap editor.

---

## Step 0 — Select file and components

**0a — Pick the file**: Glob `content/**/*.md` (also `.mdoc`, `.markdown`). Present the list via `AskUserQuestion` (single-select).

**0b — Pick the components**: Read the chosen file. Extract every component reference (block `::name` and inline `:name`), deduplicate, find and read each Vue file. Present the list via `AskUserQuestion` (`multiSelect: true`), showing for each: name + one-line summary of whether it has hardcoded content or is already slot/prop-driven.

**0c — Confirm**: Single-select confirmation before any conversion begins. If the user goes back, repeat 0b.

Process each confirmed component through Steps 1–5.

---

## Step 1 — Read and analyse the component

Read the component file in full. If it uses Nuxt UI components, call `mcp__nuxt-ui__get-component` (sections: `["theme"]`) and `mcp__nuxt-ui__get-component-metadata` to look up their slot API first.

Classify each element (see **`references/vue-slots.md`** — Slot Naming Conventions):

| Element | Becomes |
|---|---|
| Hardcoded text (headings, labels, paragraphs) | Named slot |
| Repeated items (cards, tabs) | Child component with its own slots |
| Icon name, URL, boolean | Prop |
| Color/variant differing between siblings | `color` prop + static lookup map |
| Interactive logic (tab switching, accordions) | Hardcoded inside component — not a slot |

Identify visual render order top-to-bottom — this is the required slot order in MDC.

Check if the project uses Nuxt UI and whether a layout component (`UPageHero`, `UPageSection`, `UPageCard`) already matches the visual pattern — prefer wrapping over reimplementing.

---

## Step 2 — Design the component tree

Name components generically (reusable across pages, not tied to a specific page):
- One parent section (`HomeHero`, `LandingFeatures`)
- One collection wrapper for repeated items (`FeatureList`)
- One item component per repeated element (`FeatureCard`)
- One component per interactive sub-section (`CodePlayground`)

Align slot names with the naming table in `references/vue-slots.md`. If wrapping Nuxt UI, match its slot API 1:1 so slots can be forwarded without renaming.

---

## Step 3 — Create the Vue components

**Slots**: `<slot name="..." mdc-unwrap="p" />` for editable text. Add `mdc-unwrap="p"` for slots inside headings or `<p>` tags. See `references/vue-slots.md`.

**Props**: `defineProps` for icon names, URLs, booleans, colors. Never use props for content editors need to type.

**Colors**: When siblings differ visually, add a `color` prop with a static lookup map — never build Tailwind classes dynamically. See `references/tailwind-purging.md`.

**Nuxt UI wrapping**: Forward slots via `<template #slotName><slot name="slotName" /></template>`. Use `v-if="$slots.slotName"` for optional decorative slots. Override `:ui` instead of adding wrapper divs to reset styles. See `references/nuxt-ui-components.md`.

**Interactive components**: Keep state inside the component. Use `v-show` (not `v-if`) so all slot content stays mounted.

**Script tag**: Only add `<script setup>` when there are props, refs, or computed values.

---

## Step 4 — Update the MDC in the markdown file

Replace each component usage. See **`references/mdc-syntax.md`** for colon depth, indentation, and parse error reference.

Key rules:
- Slots appear in visual DOM order (top to bottom)
- Plain-text slots (`#headline`, `#title`, `#description`) before slots containing nested components (`#body`, `#footer`)
- Short config → inline props `{key="value"}`; multiple/complex → YAML frontmatter
- `#default` works for simple single-slot components; use named slots when nested children share slot names (`#title`, `#description`) to avoid parse errors

---

## Step 5 — Verify visual parity

Compare every element against the original:
- [ ] Same section padding and container width
- [ ] Same heading text, size, weight
- [ ] Same description text and size
- [ ] Same badge/headline label and icon
- [ ] Same interactive controls with same labels and icons
- [ ] Same code snippets verbatim
- [ ] Same number of cards/items in same order
- [ ] Same icon and color per card/item (check ALL siblings — colors often differ)
- [ ] Content sections not text-centered if the original wasn't

Fix any discrepancy before moving to the next component.

---

## Step 6 — Update memory

After all components are converted, save any new patterns or edge cases to the project memory file.
