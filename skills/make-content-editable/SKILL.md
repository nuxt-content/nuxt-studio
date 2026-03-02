# studio-editify

Convert hardcoded Vue components found in a markdown file into slot-based, Nuxt Studio-editable MDC components.

## References

Read these files before executing the steps. They contain the exact rules and patterns required.

| File | When to consult |
|---|---|
| [`references/mdc-syntax.md`](references/mdc-syntax.md) | Steps 4 — colon depth, indentation, slot ordering, parse errors |
| [`references/nuxt-studio.md`](references/nuxt-studio.md) | Steps 1–4 — why slots = editable regions, v-show rule, props vs slots |
| [`references/nuxt-ui-components.md`](references/nuxt-ui-components.md) | Steps 1–3 — UPageHero/UCard slot API, :ui overrides, text-center fix |
| [`references/vue-slots.md`](references/vue-slots.md) | Step 3 — mdc-unwrap, v-if $slots, slot forwarding, script setup rules |
| [`references/tailwind-purging.md`](references/tailwind-purging.md) | Step 3 — static lookup maps for color props |

---

## Goal

Produce a 1:1 visual match of every original rendered component, but with all content moved into MDC slots and props so it is editable in Nuxt Studio's TipTap editor. Running this skill must generate the exact same visual output as before.

---

## Step 0 — Select the markdown file and pick components to convert

Ask the user which markdown file to work on, or use the file currently open in the IDE if one is active.

Read the file in full. Extract **every component** referenced in it — both block components (`::component-name`) and inline components (`:component-name`). Deduplicate the list.

For each component, locate its Vue file (search `docs/app/components/` and `components/`) and read it. Then present the full list to the user using `AskUserQuestion` with `multiSelect: true`, showing for each entry:
- The component name
- A one-line summary of whether it has hardcoded content or is already slot/prop-driven

Let the user select which components to convert. Only process the selected ones, in the order they appear in the markdown file.

Then process each selected component one by one through Steps 1–5.

---

## Step 1 — Read and analyse the component

Use `mcp__nuxt-ui__get-component` (sections: `["theme"]`) and `mcp__nuxt-ui__get-component-metadata` to look up any Nuxt UI components already used inside it.

Read the component file in full. For every element, classify it:

| Element type | Becomes |
|---|---|
| Hardcoded text (headings, paragraphs, badge labels, button labels) | Named slot |
| Repeated set of elements (list of cards, list of tabs) | Child component with its own slots |
| Icon name, URL/href, boolean flag | Inline prop `{key="value"}` or YAML frontmatter |
| Color / visual variant that differs between sibling instances | `color` prop with a static lookup map |
| Interactive UI logic (tab switching, accordions) | Hardcoded inside the component — not a slot |
| Code snippets shown in tabs | Named slot per tab (e.g. `#vue`, `#react`) |

**Identify the visual render order top-to-bottom** — this is the required order of named slots in MDC.

**Check sibling instances carefully.** If a component renders a list of similar items (cards, features), read every instance. Colors, icons, and labels often differ between siblings — each difference becomes a prop.

**Check for a Nuxt UI component match:**
- Section with badge + title + description + content below → `UPageHero`
- Feature/card grid inside a section → `UPageSection`
- Standalone card with icon/title/description → `UPageCard` or `UCard`

If a match is found, wrap the Nuxt UI component and pass slots through. Note which `ui` slots need overriding (see Step 3).

---

## Step 2 — Design the component tree

Map hardcoded sections to new components. Name them generically (reusable across pages):

- One parent "section" component (e.g. `LandingSubHero`) wrapping the matched Nuxt UI component
- One "collection" wrapper if there are repeated items (e.g. `LandingCards`)
- One "item" component for each repeated element (e.g. `LandingCard`)
- One component per interactive sub-section with its own slots (e.g. `LandingCodeExample`)

For the parent component, define named slots that map 1:1 to the Nuxt UI component's slot names where possible (`#headline`, `#title`, `#description`, `#body`, `#footer`).

---

## Step 3 — Create the Vue components

### Slot content vs props

- Editable text or rich content → `<slot name="..." mdc-unwrap="p" />`
  - Add `mdc-unwrap="p"` when the slot is inside a heading or `<p>` tag to strip the `<p>` MDC auto-wraps around block content
- Configuration (icon name, URL, boolean, color name) → `defineProps`
- Never use props for content editors need to change; never use slots for config

### Color / variant props

When sibling instances differ visually, add a `color` prop. Implement with a **static lookup map** — never build Tailwind classes dynamically (`bg-${color}-500` gets purged). Every class string must appear literally:

```vue
<script setup lang="ts">
const props = defineProps<{
  color?: 'primary' | 'purple' | 'green'
}>()

const colorMap = {
  primary: { bg: 'bg-primary-500/10', text: 'text-primary-500' },
  purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-500'  },
  green:   { bg: 'bg-green-500/10',   text: 'text-green-500'   },
}

const colors = computed(() => colorMap[props.color ?? 'primary'])
</script>
```

### Nuxt UI wrapping

- Pass every slot to the matching Nuxt UI slot: `<template #slotName><slot name="slotName" /></template>`
- Use `v-if="$slots.slotName"` for optional decorative slots (e.g. headline badge)
- Override inherited styles via `:ui` — do not add wrapper divs to reset styles
- **Critical:** `UPageHero` vertical orientation sets `text-center` on its wrapper, which cascades into `body` and `footer` slots. Always reset with `text-left` if the original component did not center that content:

```vue
:ui="{
  body:   'mx-auto max-w-4xl text-left',
  footer: 'mx-auto max-w-4xl text-left',
}"
```

### Interactive components (tabs, accordions)

- Keep the interactive logic (refs, computed) inside the component
- Expose one named slot per pane (`#vue`, `#react`, etc.)
- Use `v-show` (not `v-if`) to toggle panes so all slot content stays rendered

### Script tag

Only add `<script setup>` when there are props, refs, or computed values.

---

## Step 4 — Update the MDC in the markdown file

Replace each hardcoded component usage with the new MDC block.

### Slot order = visual DOM order

Slots must appear in MDC in the exact top-to-bottom order they render on screen. Studio presents editable regions in this sequence.

### Named text slots before slots containing nested components

Once a named slot is closed (by the next `#name` marker), the MDC parser cannot reopen it. Always declare plain-text slots (`#headline`, `#title`, `#description`) before slots that contain nested component blocks (`#body`, `#footer`). This prevents inner `#title`/`#description` markers from being misread as belonging to the outer component.

```mdc
::landing-sub-hero
#headline
Get Started in Seconds

#title
Simple to use, powerful features

#description
Install with npm and start parsing markdown in seconds

#body
  :::landing-code-example
  ...
  :::

#footer
  :::landing-cards
  ...
  :::
::
```

### Colon depth + indentation (both required)

- Top-level: `::name` — no indent
- Nested inside top-level: `:::name` — 2 spaces
- Nested one more level: `::::name` — 4 spaces
- Closing marker always matches the opening colon count
- Slot markers (`#title`, etc.) sit at the **same indentation** as their component opening
- Content lines match that same indentation

```mdc
::outer
  :::mid
    ::::deep
    #title        ← 4 spaces, same as ::::deep
    Content       ← 4 spaces
    #description  ← 4 spaces
    Content       ← 4 spaces
    ::::          ← 4 spaces
  :::             ← 2 spaces
::                ← 0 spaces
```

### Never use `#default` explicitly

Use named slots (`#body`, `#footer`, `#content`) instead. The `#default` marker combined with nested components causes MDC parse errors.

### Props in MDC

- Short config values → inline: `:::component{icon="i-lucide-zap" color="primary"}`
- Multiple or complex values → YAML frontmatter:

```mdc
:::component
---
icon: i-lucide-zap
to: /some/path
---
#title
Content
:::
```

### Code blocks inside slots

Content inside fenced code blocks is always treated as raw — MDC syntax inside a ` ``` ` block is never interpreted.

---

## Step 5 — Verify visual parity

After converting each component, compare every visual element against the original:

- [ ] Same section padding and container width
- [ ] Same heading text, size, weight
- [ ] Same description text and size
- [ ] Same badge/headline label and icon
- [ ] Same interactive controls (tabs, buttons) with same labels and icons
- [ ] Same code snippets verbatim
- [ ] Same number of cards/items, in the same order
- [ ] Same icon per card/item
- [ ] Same color per card/item (check ALL sibling instances — colors often differ)
- [ ] Same card title and description text
- [ ] Content sections (body, footer) not text-centered if the original wasn't

Fix any discrepancy before moving on to the next component.

---

## Step 6 — Update memory

After all components are converted, save any new patterns or edge cases to the project memory file.
