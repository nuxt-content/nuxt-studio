# NuxtStudio & Preview Mode

## When to Use

Setting up NuxtStudio integration, enabling preview mode, or configuring live content editing.

## NuxtStudio Overview

NuxtStudio is a visual editor for Nuxt Content sites. It provides:

- Visual WYSIWYG editing
- Real-time preview
- Git-based workflow
- Component editing

## Enable Studio

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content'],
  content: {
    studio: {
      enabled: true,
    },
  },
})
```

## Preview Mode

Preview mode allows editing content before publishing.

### Development Preview

In development, content updates via WebSocket HMR automatically.

### Production Preview

Enable production preview API:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    preview: {
      enabled: true,
      // Optional: custom API route
      api: '/__preview',
    },
  },
})
```

### Preview Token

Secure preview mode with a token:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    preview: {
      enabled: true,
      token: process.env.PREVIEW_TOKEN,
    },
  },
})
```

Access preview: `https://your-site.com?preview=your-token`

## Using Preview in Components

```vue
<script setup lang="ts">
const { enabled: previewEnabled } = useContentPreview()
</script>

<template>
  <div v-if="previewEnabled" class="preview-banner">
    Preview Mode Active
  </div>
</template>
```

## Preview API Routes

Content exposes preview endpoints:

```
POST /__preview/start   - Start preview session
POST /__preview/stop    - End preview session
GET  /__preview/status  - Check preview status
```

## Git Integration

Studio uses Git for version control:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    studio: {
      enabled: true,
      git: {
        // Branch for preview changes
        branch: 'content-preview',
      },
    },
  },
})
```

## Schema for Studio Editor

Add editor hints to your schema:

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        title: z.string().describe('The post title'),
        description: z.string().describe('SEO description'),
        image: z.string().describe('Cover image URL'),
        date: z.date().describe('Publication date'),
        tags: z.array(z.string()).describe('Post tags'),
      }),
    }),
  },
})
```

The `.describe()` method adds labels in Studio's editor UI.

## Studio Configuration

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    studio: {
      enabled: true,
      // Custom Studio URL (for self-hosted)
      url: 'https://studio.nuxt.com',
    },
  },
})
```

## Live Editing Components

Mark components as editable in Studio:

```vue
<!-- components/content/Hero.vue -->
<template>
  <div data-content-id="hero" class="hero">
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>
```

## Environment Setup

```bash
# .env
NUXT_CONTENT_STUDIO_ENABLED=true
NUXT_CONTENT_PREVIEW_ENABLED=true
NUXT_CONTENT_PREVIEW_TOKEN=your-secret-token
```

## WebSocket HMR (Development)

Content automatically syncs changes in development:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    watch: {
      // Watch for file changes
      enabled: true,
      // Debounce updates
      debounce: 500,
    },
  },
})
```

## Deployment Considerations

### Vercel

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    studio: {
      enabled: process.env.VERCEL_ENV === 'preview',
    },
  },
})
```

### Cloudflare Pages

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  content: {
    studio: {
      enabled: process.env.CF_PAGES_BRANCH !== 'main',
    },
  },
})
```

## Common Patterns

**Preview banner component:**

```vue
<!-- components/PreviewBanner.vue -->
<script setup lang="ts">
const { enabled } = useContentPreview()
</script>

<template>
  <div v-if="enabled" class="fixed top-0 left-0 right-0 bg-yellow-500 text-center py-1 z-50">
    Preview Mode - <button @click="navigateTo(useRoute().fullPath.replace('?preview', ''))">Exit</button>
  </div>
</template>
```

**Conditional preview logic:**

```ts
const { enabled } = useContentPreview()

const posts = await queryCollection('blog')
  .where('draft', '=', enabled ? undefined : false) // Show drafts in preview
  .all()
```

## Best Practices

| Do                                  | Don't                       |
| ----------------------------------- | --------------------------- |
| Use preview token in production     | Expose preview without auth |
| Enable studio only in preview envs  | Enable studio in production |
| Use `.describe()` for schema fields | Leave schema undocumented   |
| Test preview mode before deploy     | Assume preview works        |

## Resources

- NuxtStudio: https://nuxt.studio
- Preview Mode: https://content.nuxt.com/docs/studio/preview
- Studio Setup: https://content.nuxt.com/docs/studio/setup
