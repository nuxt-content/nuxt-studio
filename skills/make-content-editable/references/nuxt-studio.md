# Nuxt Studio Reference

Source: https://nuxt.studio

---

## What is Nuxt Studio?

Nuxt Studio is a visual CMS for Nuxt Content projects. It provides a **TipTap-based WYSIWYG editor** that lets content editors edit MDC-based markdown files without writing code.

---

## How the Visual Editor Works

1. Studio parses the `.md` file and generates an **AST** via the MDC module.
2. The AST is converted to a **TipTap-compatible format** for visual rendering.
3. As the editor changes content, it continuously converts back: TipTap AST → MDC AST → MDC text.
4. The final output is always standard MDC/Markdown — the source of truth is the `.md` file.

---

## How Slots Map to Editable Regions

Each `<slot name="..." />` in a Vue component becomes a **distinct editable region** in Studio's TipTap editor.

- Studio reads slots in the **order they appear in the MDC file** — this is the order editors see them.
- Named slots (`#title`, `#description`, `#body`) each get their own editing block.
- Editors can type rich text, bold, links, etc. inside each slot.
- Nested components (`:::inner-component`) inside a slot appear as embedded blocks.

**Implication:** The visual DOM render order of slots = the order they must appear in MDC = the order editors interact with them in Studio.

---

## Component Props in Studio

Props defined with `defineProps` appear as a **form-based interface** in Studio's sidebar (not editable inline in the TipTap editor).

- `icon`, `color`, `to`, `href`, boolean flags → use props (edited via form UI)
- Headings, descriptions, body text → use slots (edited inline in TipTap)

---

## Component Discovery

Vue components must be must be globally registere to be auto-discovered by Studio.

You can control which components are visible in Nuxt Studio using the `meta.components.include` and `meta.components.exclude` options in your nuxt.config.ts.

---

## Slot Design Best Practices for Studio

| Goal | Approach |
|---|---|
| Editable text/rich content | `<slot name="..." mdc-unwrap="p" />` |
| Config (icon, URL, color, boolean) | `defineProps` |
| Optional decorative element | `v-if="$slots.slotName"` around the wrapper |
| Interactive logic (tabs, accordions) | Keep inside component — not a slot |
| Toggle visibility between panes | `v-show` (keeps slot content rendered) not `v-if` |

---

## Why `v-show` Instead of `v-if` for Tabs

When tabs use `v-if`, the inactive slot's content is unmounted. Studio's TipTap editor needs all slot content to be rendered in the DOM at all times to properly parse and display editable regions. Use `v-show` to toggle visibility while keeping all slots mounted.
