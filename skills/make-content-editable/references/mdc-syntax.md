# MDC Syntax Reference

Source: https://content.nuxt.com/docs/files/markdown
Slot component: https://content.nuxt.com/docs/components/slot

---

## Block Components

Use `::` to open and close a block component. The component must have at least one `<slot />`.

```mdc
::component-name
Default slot content
::
```

---

## Named Slots

Use `#slotName` to target a named slot. The `#default` identifier explicitly targets the default slot and works fine for simple components with a single content area. Avoid it when the component contains nested child components that have their own `#title` or `#description` slots — the MDC parser can misread those inner markers as belonging to the outer component, causing parse errors. In that case use distinct names like `#body`, `#footer` instead.

```mdc
::hero
My Page Title

#description
This will be rendered inside the `description` slot.
::
```

---

## Nesting: Colon Depth + Indentation (BOTH required)

Every nesting level adds one colon AND two spaces of indentation. The closing marker must exactly match the opening colon count.

| Nesting level | Colons | Indent |
|---|---|---|
| Top-level | `::` | 0 spaces |
| Inside top-level | `:::` | 2 spaces |
| Inside that | `::::` | 4 spaces |

Slot markers (`#title`, `#body`) and their content sit at the **same indentation** as their component's opening marker.

```mdc
::outer
  :::mid
    ::::deep
    #title
    Content here
    #description
    More content
    ::::
  :::
::
```

---

## Slot Order Rule

Slots must appear in the **visual DOM render order** (top to bottom). Studio's TipTap editor presents editable regions in this exact sequence.

**Critical ordering constraint:** Plain-text slots (`#headline`, `#title`, `#description`) must always appear **before** slots that contain nested components (`#body`, `#footer`). Once a named slot is closed by the next `#name` marker, the MDC parser cannot reopen it — inner `#title` markers inside nested components would be misread as belonging to the outer component.

```mdc
::landing-section
#headline
Badge text

#title
Heading text

#description
Paragraph text

#body
  :::nested-component
  :::

#footer
  :::another-nested
  :::
::
```

---

## Props

**Inline (short values):**
```mdc
::alert{type="warning" icon="i-lucide-zap"}
Content
::
```

**YAML frontmatter (multiple/complex values):**
```mdc
::icon-card
---
icon: i-lucide-zap
to: /some/path
color: primary
---
#title
Card title
::
```

**Bind to frontmatter variable:**
```mdc
::alert{:type="type"}
Content
::
```

---

## `mdc-unwrap` Prop

MDC wraps block content in `<p>` tags automatically. When a slot is inside a heading (`<h1>`–`<h6>`) or another `<p>`, use `mdc-unwrap="p"` to strip the extra wrapper:

```vue
<!-- Vue component -->
<h2>
  <slot name="title" mdc-unwrap="p" />
</h2>
<p>
  <slot name="description" mdc-unwrap="p" />
</p>
```

`mdc-unwrap` accepts a string of space-separated tag names, e.g. `mdc-unwrap="p ul li"`.

---

## Code Blocks Inside Slots

Content inside fenced code blocks (` ``` `) is always treated as raw text — MDC syntax inside a code block is never interpreted.

---

## Common Parse Errors

| Error | Cause | Fix |
|---|---|---|
| `Cannot close componentContainerSection` | `#default` used on a component whose nested child components share slot names (`#title`, `#description`) | Replace `#default` with a distinct named slot (`#body`, `#content`) |
| Closing marker mismatch | `:::component` closed with `::` | Match colon count exactly |
| Inner slots misread as outer | Text slots declared after slots with nested components | Always declare text-only slots before slots containing nested components |
