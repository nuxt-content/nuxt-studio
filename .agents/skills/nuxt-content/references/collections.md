# Collections

## When to Use

Setting up `content.config.ts`, defining collection schemas, or configuring content sources.

## Defining Collections

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'  // Import z from 'zod' directly (not from @nuxt/content)

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**/*.md',
      schema: z.object({
        date: z.date(),
        tags: z.array(z.string()).optional(),
        image: z.string().optional(),
      }),
    }),
    authors: defineCollection({
      type: 'data',
      source: 'authors/*.yml',
      schema: z.object({
        name: z.string(),
        avatar: z.string(),
        twitter: z.string().optional(),
      }),
    }),
  },
})
```

**Note:** In v3.7.0+, the `z` re-export from `@nuxt/content` was deprecated. Always import from `zod` directly.

## Collection Types

| Type   | Use Case             | Includes                                                    |
| ------ | -------------------- | ----------------------------------------------------------- |
| `page` | Content with routes  | `path`, `title`, `description`, `seo`, `body`, `navigation` |
| `data` | Structured data only | `id`, `stem`, `extension`, `meta`                           |

**Page collections** auto-generate: `path` from file location, `title` from first H1, `description` from first paragraph.

**Data collections** for non-routable content like authors, settings, translations.

## Schema Definition

Use Zod (or other validators like Valibot since v3.7+) for type-safe schemas:

```ts
// Using Zod
import { z } from 'zod'

schema: z.object({
  // Required fields
  title: z.string(),

  // Optional with defaults
  draft: z.boolean().default(false),

  // Arrays
  tags: z.array(z.string()).optional(),

  // Dates (parsed from frontmatter)
  publishedAt: z.date(),

  // Enums
  status: z.enum(['draft', 'published', 'archived']),

  // Nested objects
  author: z.object({
    name: z.string(),
    email: z.string().email(),
  }).optional(),
})
```

**Multi-validator support (v3.7+):** Nuxt Content supports multiple schema validators including Zod v4 and Valibot via the standard schema spec. Import your preferred validator directly.

## Source Patterns

```ts
// Single directory
source: 'blog/**/*.md'

// Multiple patterns
source: ['posts/**/*.md', 'articles/**/*.md']

// Exclude patterns
source: {
  include: 'docs/**/*.md',
  exclude: ['docs/internal/**', 'docs/**/_*.md'],
}

// Single CSV file (v3.10+)
source: 'data/products.csv'
```

## Remote Sources (GitHub)

Pull content from external repositories:

```ts
export default defineContentConfig({
  collections: {
    nuxtDocs: defineCollection({
      type: 'page',
      source: {
        repository: 'https://github.com/nuxt/content',
        include: 'docs/content/**',
        prefix: '/docs',
        // Optional: shallow clone for faster fetching (v3.10+)
        shallow: true,
      },
    }),
  },
})
```

**Private repositories:**

```ts
source: {
  repository: 'https://github.com/org/private-repo',
  include: 'docs/**/*.md',
  authToken: process.env.GITHUB_TOKEN, // GitHub PAT
}
```

**Bitbucket with basic auth:**

```ts
source: {
  repository: 'https://bitbucket.org/org/repo',
  include: '**/*.md',
  authBasic: { username: 'user', password: process.env.BITBUCKET_PASSWORD },
}
```

## Custom API Sources

Fetch content from any API using `defineCollectionSource`:

```ts
import { defineCollection, defineCollectionSource, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

const apiSource = defineCollectionSource({
  getKeys: async () => {
    const items = await fetch('https://api.example.com/posts').then(r => r.json())
    return items.map((item: { id: string }) => `${item.id}.json`)
  },
  getItem: async (key: string) => {
    const id = key.replace('.json', '')
    return fetch(`https://api.example.com/posts/${id}`).then(r => r.json())
  },
})

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'data',
      source: apiSource,
      schema: z.object({
        title: z.string(),
        content: z.string(),
      }),
    }),
  },
})
```

## Path Extraction

File paths become content properties:

```
content/blog/2024/my-post.md
         └─────┬────┘
              stem: "blog/2024/my-post"
              path: "/blog/2024/my-post"
```

Override path in frontmatter:

```yaml
---
path: /custom-url
---
```

## Navigation Metadata

Control navigation behavior per-file:

```yaml
---
navigation:
  title: Short Nav Title
  icon: heroicons:home
---
```

Or per-directory with `.navigation.yml`:

```yaml
# content/blog/.navigation.yml
title: Blog Posts
icon: heroicons:newspaper
```

## Best Practices

| Do                                   | Don't                                      |
| ------------------------------------ | ------------------------------------------ |
| Use `page` for routable content      | Use `page` for config/data files           |
| Define explicit schemas              | Rely on implicit types                     |
| Use Zod defaults for optional fields | Leave required fields without validation   |
| Colocate related content             | Scatter files across unrelated directories |

## Common Patterns

**Blog with categories:**

```ts
blog: defineCollection({
  type: 'page',
  source: 'blog/**/*.md',
  schema: z.object({
    category: z.enum(['tech', 'life', 'news']),
    date: z.date(),
    featured: z.boolean().default(false),
  }),
})
```

**Documentation with ordering:**

```ts
docs: defineCollection({
  type: 'page',
  source: 'docs/**/*.md',
  schema: z.object({
    order: z.number().default(999),
    section: z.string().optional(),
  }),
})
```

**Schema extension and inheritance (v3.8+):**

```ts
// Base schema with common fields
const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
})

// Extended schema with additional properties
const blogSchema = baseSchema.extend({
  author: z.string(),
  date: z.date(),
  tags: z.array(z.string()).optional(),
})

blog: defineCollection({
  type: 'page',
  source: 'blog/**/*.md',
  schema: blogSchema,
})
```

**Raw content access:**

```ts
// Magic field - include rawbody to access original content
docs: defineCollection({
  type: 'page',
  source: '**/*.md',
  schema: z.object({
    rawbody: z.string(), // Auto-filled with raw markdown
  }),
})
// Exclude per-file: add `rawbody: ''` in frontmatter
```

**i18n with per-locale collections:**

```ts
// content.config.ts - separate collection per language
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { z } from 'zod'

const commonSchema = z.object({ title: z.string() })

export default defineContentConfig({
  collections: {
    content_en: defineCollection({ type: 'page', source: { include: 'en/**', prefix: '' }, schema: commonSchema }),
    content_fr: defineCollection({ type: 'page', source: { include: 'fr/**', prefix: '' }, schema: commonSchema }),
  },
})

// pages/[...slug].vue
const collection = (`content_${locale.value}`) as keyof Collections
const page = await queryCollection(collection).path(slug).first()
```

**Inherit component prop types (v3.7+):**

```ts
import { defineCollection, defineContentConfig, property } from '@nuxt/content'
import { z } from 'zod'

defineCollection({
  type: 'page',
  source: 'blog/**/*.md',
  schema: z.object({
    // Use property().inherit() to inherit Vue component props
    hero: property(z.object({})).inherit('app/components/HeroComponent.vue'),
    title: z.string(),
  }),
})
```

This allows schema fields to automatically match Vue component prop types.

## Resources

- Collections: https://content.nuxt.com/docs/collections/collections
- Schema: https://content.nuxt.com/docs/collections/schema
- Sources: https://content.nuxt.com/docs/collections/sources
