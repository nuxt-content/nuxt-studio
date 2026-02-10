# Querying Content

## When to Use

Using `queryCollection()`, building navigation, implementing search, or getting prev/next items.

## Query Builder

```ts
const posts = await queryCollection('blog')
  .where('draft', '=', false)
  .order('date', 'DESC')
  .limit(10)
  .all()

// Single item
const post = await queryCollection('blog')
  .where('path', '=', '/blog/my-post')
  .first()

// Count
const total = await queryCollection('blog')
  .where('category', '=', 'tech')
  .count()
```

## Operators

| Operator             | Example                                  | Description        |
| -------------------- | ---------------------------------------- | ------------------ |
| `=`                  | `where('status', '=', 'published')`      | Exact match        |
| `<>`                 | `where('status', '<>', 'draft')`         | Not equal          |
| `>`, `<`, `>=`, `<=` | `where('order', '>', 5)`                 | Comparison         |
| `IN`                 | `where('tag', 'IN', ['vue', 'nuxt'])`    | Match any in array |
| `BETWEEN`            | `where('date', 'BETWEEN', [start, end])` | Range inclusive    |
| `LIKE`               | `where('title', 'LIKE', '%vue%')`        | Pattern match      |
| `IS NULL`            | `where('image', 'IS NULL', true)`        | Null check         |
| `IS NOT NULL`        | `where('image', 'IS NOT NULL', true)`    | Not null           |

## Complex Queries

```ts
// AND conditions
const posts = await queryCollection('blog')
  .where('draft', '=', false)
  .andWhere(group => group
    .where('category', '=', 'tech')
    .orWhere('featured', '=', true)
  )
  .all()

// OR conditions
const posts = await queryCollection('blog')
  .where('author', '=', 'john')
  .orWhere('author', '=', 'jane')
  .all()
```

## Select Fields

```ts
// Select specific fields (reduces payload)
const titles = await queryCollection('blog')
  .select('title', 'path', 'date')
  .all()
```

## Navigation

Generate hierarchical navigation trees:

```ts
// In pages/[...slug].vue or composables
const navigation = await queryCollectionNavigation('docs')

// With custom fields
const navigation = await queryCollectionNavigation('docs', ['title', 'icon', 'description'])
```

Returns nested structure:

```ts
[
  {
    title: 'Getting Started',
    path: '/docs/getting-started',
    children: [
      { title: 'Installation', path: '/docs/getting-started/installation' },
      { title: 'Configuration', path: '/docs/getting-started/configuration' },
    ]
  }
]
```

**Navigation control** via frontmatter:

```yaml
---
navigation: false # Exclude from nav
---
```

Or with custom title:

```yaml
---
navigation:
  title: Short Title
  icon: heroicons:home
---
```

## Surroundings (Prev/Next)

```ts
const { prev, next } = await queryCollectionItemSurroundings(
  'docs',
  '/docs/current-page',
  { before: 1, after: 1 }
)

// With specific fields
const { prev, next } = await queryCollectionItemSurroundings(
  'docs',
  currentPath,
  { before: 1, after: 1, fields: ['title', 'path', 'description'] }
)
```

## Search Sections

Split pages into searchable sections:

```ts
const sections = await queryCollectionSearchSections('docs', {
  minHeading: 2,  // Minimum heading level to index (v3.10+)
  maxHeading: 4,  // Maximum heading level to index (v3.10+)
})

// Returns
  [
    {
      id: 'docs:getting-started#installation',
      title: 'Installation',
      titles: ['Getting Started', 'Installation'],
      content: 'Section text content...',
      path: '/docs/getting-started',
    }
  ]

// Include extra fields (v3.4+)
const sections = await queryCollectionSearchSections('docs', {
  minHeading: 2,
  maxHeading: 3,
  fields: ['description', 'category'],
})
```

## Server-Side Queries

In server routes, pass the event:

```ts
// server/api/posts.get.ts
export default defineEventHandler(async (event) => {
  return await queryCollection(event, 'blog')
    .where('draft', '=', false)
    .all()
})
```

## Common Patterns

**Latest posts:**

```ts
const latest = await queryCollection('blog')
  .where('draft', '=', false)
  .order('date', 'DESC')
  .limit(5)
  .all()
```

**Posts by tag:**

```ts
const tagged = await queryCollection('blog')
  .where('tags', 'LIKE', `%${tag}%`)
  .all()
```

**Paginated list:**

```ts
const page = 1
const perPage = 10
const posts = await queryCollection('blog')
  .order('date', 'DESC')
  .skip((page - 1) * perPage)
  .limit(perPage)
  .all()
```

**Featured + recent:**

```ts
const [featured, recent] = await Promise.all([
  queryCollection('blog').where('featured', '=', true).first(),
  queryCollection('blog').order('date', 'DESC').limit(5).all(),
])
```

## Best Practices

| Do                                | Don't                               |
| --------------------------------- | ----------------------------------- |
| Use `.select()` to reduce payload | Fetch all fields when only need few |
| Cache navigation queries          | Rebuild navigation on every page    |
| Use `.first()` for single items   | Use `.all()[0]`                     |
| Pass event in server routes       | Omit event on server side           |

## Utility Functions (v3.6+)

Helper functions for common navigation patterns:

```ts
// Find page headline (first H1)
const headline = findPageHeadline(page)

// Get breadcrumb trail
const breadcrumb = findPageBreadcrumb(navigation, '/docs/collections/schema')
// Returns: [{ title: 'Docs', path: '/docs' }, { title: 'Collections', path: '/docs/collections' }, ...]

// Get immediate children of a page
const children = findPageChildren(navigation, '/docs/collections')

// Get siblings (prev/next at same level)
const siblings = findPageSiblings(navigation, '/docs/collections/schema')
```

## Resources

- Query API: https://content.nuxt.com/docs/querying/query-collection
- Navigation: https://content.nuxt.com/docs/querying/query-collection-navigation
- Search: https://content.nuxt.com/docs/querying/query-collection-search-sections
