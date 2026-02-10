# Content Patterns

Blog post structure, frontmatter, and component patterns for Nuxt ecosystem documentation.

## Blog Post Frontmatter

```yaml
---
title: Post Title
description: Brief description for SEO and previews (under 160 chars)
navigation: false
image: /assets/blog/slug.png
authors:
  - name: Author Name
    avatar:
      src: https://github.com/username.png
    to: https://x.com/username
date: 2025-11-05T10:00:00.000Z
category: Release
---
```

**Categories**: `Release` (version announcements), `Article` (tutorials, guides)

**Author links**: GitHub, X/Twitter, Bluesky (`https://bsky.app/profile/...`)

## Blog Post Structure

1. **Opening** (1-2 paragraphs) - Announce what's new, why it matters
2. **Key callout** - `::note` or `::callout` with requirements/prerequisites
3. **Feature sections** - `## Emoji Feature Name` headers
4. **Code examples** - With file path labels
5. **Breaking changes** - If release post
6. **Thank you** - Credit contributors
7. **Resources** - Links to docs, repo
8. **Release link** - `::read-more` to full changelog

## Recommended Modules

For enhanced documentation features:

| Module                                                                    | Purpose                                                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`nuxt-content-twoslash`](https://github.com/antfu/nuxt-content-twoslash) | TwoSlash for Nuxt Content - inline TypeScript type hints in code blocks |

### Installation

```bash
pnpm add -D nuxt-content-twoslash
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-content-twoslash', '@nuxt/content'] // twoslash before content
})
```

## Component Patterns

Use the right component for the right purpose:

| Need             | Component                         | When                       |
| ---------------- | --------------------------------- | -------------------------- |
| Background info  | `::note`                          | Supplementary context      |
| Best practice    | `::tip`                           | Recommendations            |
| Potential issue  | `::warning`                       | Things that could go wrong |
| Must-know        | `::important`                     | Required actions           |
| Danger           | `::caution`                       | Destructive operations     |
| CTA button       | `:u-button{to="..." label="..."}` | Downloads, external links  |
| Package managers | `::code-group{sync="pm"}`         | pnpm/npm/yarn variants     |
| Expandable       | `::collapsible{title="..."}`      | Advanced details           |
| Images           | `::carousel{items: [...]}`        | Multiple screenshots       |
| Sequential steps | `::steps`                         | Multi-step instructions    |

> For component props/details: see **nuxt-ui** skill

## Steps Component

The `::steps` component auto-renders step numbers. **Do NOT include numbers in step titles** — they'll be duplicated.

```md
<!-- ✅ Correct -->
::steps
### Install the module
### Configure nuxt.config.ts
### Restart dev server
::

<!-- ❌ Wrong (numbers will duplicate) -->
::steps
### 1. Install the module
### 2) Configure nuxt.config.ts
### Step 3: Restart dev server
::
```

## Code Block Labels

Always include file path:

````md
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['@nuxt/content']
})
```

```vue [app/pages/index.vue]
<template>
  <div>Hello</div>
</template>
```

```bash
pnpm add @nuxt/content
```
````

## YAML Props Format

For components with multiple props, use YAML frontmatter:

```md
::read-more
---
icon: i-simple-icons-github
target: _blank
to: https://github.com/nuxt/nuxt/releases/tag/v4.0.0
---
Read the full release notes.
::
```

```md
::carousel
---
items:
  - /assets/blog/image-1.png
  - /assets/blog/image-2.png
---
::
```

## Cross-References

Link to related content:

```md
<!-- Inline link -->
See the [configuration guide](/docs/getting-started/configuration).

<!-- Read-more block -->
::read-more{to="/docs/api/composables/use-fetch"}
::

<!-- With custom text and icon -->
::read-more
---
icon: i-simple-icons-github
to: https://github.com/nuxt/nuxt
target: _blank
---
View the source code.
::
```

> For MDC syntax details: see **nuxt-content** skill (rendering.md)
