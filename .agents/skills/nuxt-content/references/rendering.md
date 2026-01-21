# Rendering Content

> **For writing style/structure:** see `document-writer` skill

## When to Use

Working with `<ContentRenderer>`, MDC syntax, custom prose components, or code highlighting.

## ContentRenderer

Render parsed markdown body:

```vue
<script setup lang="ts">
const post = await queryCollection('blog')
  .where('path', '=', '/blog/my-post')
  .first()
</script>

<template>
  <ContentRenderer v-if="post" :value="post" />
</template>
```

**With custom wrapper:**

```vue
<ContentRenderer :value="post">
  <template #default="{ body }">
    <article class="prose">
      <component :is="body" />
    </article>
  </template>
</ContentRenderer>
```

## MDC Syntax

Use Vue components inside markdown:

```md
<!-- Inline component -->

:icon{name="heroicons:star"}

<!-- Block component -->

::callout{type="warning"}
This is a warning message.
::

<!-- With slots -->

::card
#title
Card Title

#default
Card content goes here.
::

<!-- Nested components -->

::grid{cols="2"}
::card
First card
::

::card
Second card
::
::
```

## Component Props

```md
<!-- String props -->

:badge{label="New"}

<!-- Boolean props -->

::collapse{open}
Content
::

<!-- Object/array props (YAML) -->

## ::chart

data:

- value: 10
- value: 20

---

::
```

## MDC Component Location

Components in `components/content/` are auto-registered for MDC:

```
components/
└── content/
    ├── Callout.vue      → ::callout
    ├── ProseCode.vue    → Code blocks
    └── ProseH2.vue      → ## headings
```

## Prose Components

Override default HTML elements with custom components:

| Element        | Component            | Markdown      |
| -------------- | -------------------- | ------------- |
| `<p>`          | `ProseP`             | Paragraphs    |
| `<h1>`-`<h6>`  | `ProseH1`-`ProseH6`  | `#` headings  |
| `<a>`          | `ProseA`             | `[link](url)` |
| `<code>`       | `ProseCode`          | `` `code` ``  |
| `<pre>`        | `ProsePre`           | Code blocks   |
| `<ul>`, `<ol>` | `ProseUl`, `ProseOl` | Lists         |
| `<img>`        | `ProseImg`           | `![alt](src)` |
| `<table>`      | `ProseTable`         | Tables        |
| `<blockquote>` | `ProseBlockquote`    | `>` quotes    |

**Custom prose component:**

```vue
<!-- components/content/ProseH2.vue -->
<template>
  <h2 :id="id" class="group">
    <a :href="`#${id}`" class="anchor">
      <slot />
    </a>
  </h2>
</template>

<script setup lang="ts">
defineProps<{ id?: string }>()
</script>
```

## Code Highlighting

Shiki provides syntax highlighting. Configure in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  content: {
    build: {
      markdown: {
        highlight: {
          theme: 'github-dark',
          // Or multi-theme
          themes: {
            default: 'github-light',
            dark: 'github-dark',
          },
          // Additional languages
          langs: ['vue', 'typescript', 'bash', 'yaml'],
        },
      },
    },
  },
})
```

**In markdown:**

````md
```ts
const foo = 'bar'
```

```vue
<template>
  <div>Hello</div>
</template>
```
````

**Line highlighting:**

````md
```ts {2,4-6}
const a = 1
const b = 2  // highlighted
const c = 3
const d = 4  // highlighted
const e = 5  // highlighted
const f = 6  // highlighted
```
````

**Filename display:**

````md
```ts [nuxt.config.ts]
export default defineNuxtConfig({})
```
````

## Custom Components Example

**Alert component:**

```vue
<!-- components/content/Alert.vue -->
<template>
  <div :class="['alert', `alert-${type}`]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ type?: 'info' | 'warning' | 'error' }>(), {
  type: 'info',
})
</script>
```

Usage in markdown:

```md
::alert{type="warning"}
Be careful with this operation.
::
```

## Table of Contents

Access TOC from parsed content:

```vue
<script setup lang="ts">
const post = await queryCollection('blog').where('path', '=', route.path).first()
const toc = post?.body?.toc?.links || []
</script>

<template>
  <nav>
    <ul>
      <li v-for="link in toc" :key="link.id">
        <a :href="`#${link.id}`">{{ link.text }}</a>
      </li>
    </ul>
  </nav>
</template>
```

## Best Practices

| Do                                     | Don't                            |
| -------------------------------------- | -------------------------------- |
| Use MDC for reusable content patterns  | Embed raw HTML in markdown       |
| Create semantic prose components       | Override prose without purpose   |
| Use Shiki themes matching your design  | Mix multiple highlight libraries |
| Leverage slots for flexible components | Hardcode all component content   |

## Resources

- MDC Syntax: https://content.nuxt.com/docs/files/markdown#mdc-syntax
- Prose Components: https://content.nuxt.com/docs/components/prose
- ContentRenderer: https://content.nuxt.com/docs/components/content-renderer
