# Configuration

## When to Use

Setting up database backend, configuring markdown processing, or customizing renderer behavior.

## Database Configuration

Content uses SQL for queries. Configure in `nuxt.config.ts`:

### SQLite (Default)

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'sqlite',
      filename: '.data/content.db',
      // Optional: add database indexes for better query performance (v3.10+)
      indexes: [
        { fields: ['path'] },
        { fields: ['date', 'draft'] },
      ],
    },
  },
})
```

### PostgreSQL

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
})
```

### Cloudflare D1

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB', // Matches wrangler.toml binding
    },
  },
})
```

### LibSQL / Turso

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'libsql',
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
  },
})
```

### PGlite (In-memory)

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'pglite',
    },
  },
})
```

## Local Development Database

Use different database for dev vs production:

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB',
    },
    // Dev-only SQLite
    _localDatabase: {
      type: 'sqlite',
      filename: '.data/content-dev.db',
    },
  },
})
```

## Markdown Configuration

```ts
export default defineNuxtConfig({
  content: {
    build: {
      markdown: {
        // Table of contents
        toc: {
          depth: 3, // Max heading depth
          searchDepth: 2, // Search depth in tree
        },

        // Extract title from first H1
        contentHeading: true,

        // Remark plugins (markdown → mdast)
        remarkPlugins: {
          'remark-emoji': {},
          'remark-gfm': { singleTilde: false },
        },

        // Rehype plugins (mdast → hast)
        rehypePlugins: {
          'rehype-external-links': {
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
          },
        },

        // Code highlighting
        highlight: {
          theme: 'github-dark',
          langs: ['js', 'ts', 'vue', 'css', 'html', 'bash', 'yaml', 'json'],
        },
      },
    },
  },
})
```

## Highlight Themes

Single theme:

```ts
highlight: {
  theme: 'github-dark',
}
```

Multi-theme (light/dark):

```ts
highlight: {
  themes: {
    default: 'github-light',
    dark: 'github-dark',
  },
}
```

Available themes: `github-dark`, `github-light`, `dracula`, `nord`, `one-dark-pro`, etc. See [Shiki themes](https://shiki.style/themes).

## Renderer Configuration

```ts
export default defineNuxtConfig({
  content: {
    renderer: {
      // Component aliases for prose
      alias: {
        p: 'MyParagraph',
        h2: 'MyHeading2',
        code: 'MyCodeBlock',
      },

      // Anchor links per heading level
      anchorLinks: {
        h1: false,
        h2: true,
        h3: true,
        h4: false,
        h5: false,
        h6: false,
      },
    },
  },
})
```

## File Type Configuration

### YAML

```ts
export default defineNuxtConfig({
  content: {
    build: {
      yaml: {
        // YAML parser options
      },
      // Or disable YAML parsing
      yaml: false,
    },
  },
})
```

### CSV

```ts
export default defineNuxtConfig({
  content: {
    build: {
      csv: {
        json: true, // Parse as JSON objects
        delimiter: ',', // Column delimiter
      },
    },
  },
})
```

## Experimental Options

```ts
export default defineNuxtConfig({
  content: {
    experimental: {
      // Use Node.js native SQLite (Node.js v22.5.0+, v3.4+)
      nativeSqlite: true,

      // Specify SQLite connector (v3.6+)
      // 'better-sqlite3' moved to peer dependency in v3.6.0
      sqliteConnector: 'better-sqlite3', // or 'native' (Node 22+), 'sqlite3'
    },
  },
})
```

**Note:** Starting v3.6.0, `better-sqlite3` is a peer dependency. The module will prompt you to install your preferred SQLite connector on first run.

## Full Configuration Example

```ts
export default defineNuxtConfig({
  content: {
    database: {
      type: 'sqlite',
      filename: '.data/content.db',
    },
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 2 },
        remarkPlugins: {
          'remark-gfm': {},
        },
        highlight: {
          themes: { default: 'github-light', dark: 'github-dark' },
          langs: ['vue', 'ts', 'bash', 'yaml', 'json'],
        },
      },
    },
    renderer: {
      anchorLinks: { h2: true, h3: true },
    },
  },
})
```

## Environment Variables

Common env vars for database:

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/db

# Turso/LibSQL
TURSO_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# GitHub (for remote sources)
GITHUB_TOKEN=ghp_xxxx
```

## Content Hooks

Modify content during build:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  hooks: {
    'content:file:beforeParse': function (ctx) {
      // Modify raw content before parsing
      if (ctx.file.id.endsWith('.md')) {
        ctx.file.body = ctx.file.body.replace(/oldTerm/gi, 'newTerm')
      }
    },
    'content:file:afterParse': function (ctx) {
      // Add computed fields after parsing
      const wordCount = ctx.file.body?.split(/\s+/).length || 0
      ctx.content.readingTime = Math.ceil(wordCount / 180)
    },
  },
})
```

**Note:** Fields added in `afterParse` must be defined in your collection schema:

```ts
schema: z.object({ readingTime: z.number().optional() })
```

## LLMs Integration

Generate AI-ready content with `nuxt-llms`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', 'nuxt-llms'],
  llms: {
    domain: 'https://your-site.com',
    title: 'Your Site',
    sections: [
      {
        title: 'Docs',
        contentCollection: 'docs',
        contentFilters: [{ field: 'draft', operator: '<>', value: true }],
      },
    ],
  },
})
```

Auto-generates `/llms.txt` for LLM consumption.

## Best Practices

| Do                                      | Don't                            |
| --------------------------------------- | -------------------------------- |
| Use `_localDatabase` for dev/prod split | Use production DB in development |
| Specify only needed langs               | Load all Shiki languages         |
| Use multi-theme for dark mode support   | Hardcode single theme            |
| Configure TOC depth for your content    | Use defaults without checking    |

## Resources

- Configuration: https://content.nuxt.com/docs/getting-started/configuration
- Database: https://content.nuxt.com/docs/getting-started/configuration#database
- Markdown: https://content.nuxt.com/docs/getting-started/configuration#markdown
