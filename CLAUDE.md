# Nuxt Studio

## Overview

Nuxt Studio is an open-source, self-hostable Nuxt module that enables visual content editing in production for [Nuxt Content](https://content.nuxt.com) websites. Originally a premium hosted platform, it's now a free MIT-licensed module that runs entirely on your own infrastructure.

**Key Concept**: This module adds a full-featured CMS editor directly into your Nuxt Content application, allowing non-technical users to edit content and commit changes to Git without needing local development tools.

## Core Features

- **Visual Editors**: TipTap-based Notion-like editor for Markdown with MDC component support, form-based editor for YAML/JSON
- **Code Editor**: Monaco editor with syntax highlighting for direct file editing
- **Real-time Preview**: See changes instantly on production website
- **Git Integration**: Commits directly to GitHub/GitLab repositories
- **Multi-provider Auth**: GitHub, GitLab, Google OAuth, or custom authentication
- **Media Management**: Visual media library with drag-and-drop support
- **Development Mode**: Local filesystem sync for development
- **Production Mode**: OAuth + Git publishing for deployed sites
- **i18n Support**: 25 languages built-in

## Architecture

### Project Structure

```
studio/
├── src/
│   ├── app/           # Vue app for the Studio editor interface
│   │   ├── src/       # Vue components, composables, utils
│   │   └── service-worker.ts
│   └── module/        # Nuxt module code
│       └── src/
│           ├── runtime/  # Runtime server routes & plugins
│           └── module.ts # Main module definition
├── playground/        # Development examples
│   ├── docus/         # Full-featured example
│   └── minimal/       # Minimal example
├── docs/              # Documentation site (also a Nuxt Content app)
```

### Two Operating Modes

1. **Development Mode** (default in dev)
   - Direct filesystem access via server routes
   - No auth required
   - Changes sync immediately to local files
   - No Git operations

2. **Production Mode** (default in prod)
   - OAuth authentication required
   - Git provider integration for commits
   - Changes pushed to repository
   - Triggers CI/CD pipeline

## Key Technologies

- **Nuxt 3**: Core framework
- **Nuxt Content**: Content management layer (peer dependency)
- **@nuxtjs/mdc**: MDC (Markdown Components) parsing and rendering
- **TipTap**: Visual WYSIWYG editor
- **Monaco Editor**: Code editor
- **Vue Router**: SPA routing inside Studio
- **IndexedDB**: Client-side draft storage via `idb-keyval`
- **Service Worker**: Offline support and caching
- **Shiki**: Syntax highlighting
- **Zod**: Schema validation for forms

## Configuration

### Basic Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/content', 'nuxt-studio'],

  studio: {
    route: '/_studio',  // Admin route

    // Git repository config (required for production)
    repository: {
      provider: 'github',  // 'github' | 'gitlab'
      owner: 'username',
      repo: 'repo-name',
      branch: 'main',
      rootDir: '',         // For monorepos
      private: true        // Request private repo access
    },

    // i18n
    i18n: {
      defaultLocale: 'en'  // 25 languages available
    },

    // Component filtering
    meta: {
      components: {
        include: ['Content*'],  // Whitelist
        exclude: ['Hidden*']    // Blacklist
      }
    }
  }
})
```

### Environment Variables

**GitHub OAuth + GitHub Git Provider**:
```bash
STUDIO_GITHUB_CLIENT_ID=xxx
STUDIO_GITHUB_CLIENT_SECRET=xxx
STUDIO_GITHUB_MODERATORS=email1@example.com,email2@example.com  # Optional
```

**GitLab OAuth + GitLab Git Provider**:
```bash
STUDIO_GITLAB_APPLICATION_ID=xxx
STUDIO_GITLAB_CLIENT_SECRET=xxx
STUDIO_GITLAB_MODERATORS=email1@example.com,email2@example.com  # Optional
```

**Google OAuth** (requires PAT):
```bash
STUDIO_GOOGLE_CLIENT_ID=xxx
STUDIO_GOOGLE_CLIENT_SECRET=xxx
STUDIO_GOOGLE_MODERATORS=email1@example.com,email2@example.com  # Required!
STUDIO_GITHUB_TOKEN=xxx  # or STUDIO_GITLAB_TOKEN
```

**Custom Auth** (requires PAT):
```bash
STUDIO_GITHUB_TOKEN=xxx  # or STUDIO_GITLAB_TOKEN
```

## Authentication vs Git Providers

**Important distinction**:
- **Auth Providers**: Control who can login (GitHub OAuth, GitLab OAuth, Google OAuth, Custom)
- **Git Providers**: Control where content is committed (GitHub, GitLab)

You can mix and match: e.g., Google OAuth for auth + GitHub for Git operations (requires PAT).

## Development Workflow

### Setup

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Build app and service worker
pnpm prepack
```

### Running Locally

```bash
# Terminal 1: Start the Vue app dev server
pnpm dev:app  # Runs on :5151

# Terminal 2: Start the Nuxt playground
pnpm dev      # Runs on :3000, points to :5151 for Studio app
```

### Testing

```bash
pnpm verify      # Runs all checks
pnpm test        # Vitest tests
pnpm typecheck   # Type checking
pnpm lint        # ESLint
```

## Key Concepts

### File types

User can edit:
- Markdown files with MDC syntax
- YAML files
- JSON files

#### Markdown with MDC syntax

**Vue components in Markdown**

Studio leverages Nuxt Content's MDC syntax for embedding Vue components in Markdown with props and slots.

```md
::component-name
---
prop: value
---
#slot-name
Slot content here
::
```

**Frontmatter**

Frontmatter is a convention of Markdown-based CMS to provide meta-data to pages, like description or title. In Nuxt Content, the frontmatter uses the YAML syntax with key: value pairs.

```md
---
title: 'Title of the page'
description: 'meta description of the page'
---

<!-- Content of the page in markdown (MDC) format -->
```

#### JSON files

```json
{
  "title": "Title of the page",
  "description": "meta description of the page"
}
```

#### YAML files

```yaml
title: 'Title of the page'
description: 'meta description of the page'
```

### Editors

**Tiptap editor**
- Can edit Markdown files with MDC syntax
- Tiptap editor manipulate Tiptap AST which is directly converted to MDC AST and stored in the existing SQLite database
- If we want to display raw markdown of a file, we can use the `generateContentFromDocument` function to get the raw markdown (ie. preview page or monaco editor)
- If we want to generate the MDC AST from the raw markdown, we can use the `generateDocumentFromMarkdownContent` function

**Form editor**
- Can edit YAML files
- Can edit JSON files
- A vmodel form is generated based on the collection schema
- Every time the form is updated, the content is converted to pure json to be stored in the database

**Code editor**
- Markdown files with MDC syntax
- YAML files
- JSON files
- The code editor is the only one that can edit raw content, this is a debug editor we don't want to improve it contrary to the other editors.

### Draft system

**In production mode:**
- Exisiting db files is stored in SQLite browser side database by Nuxt Content. It's loaded by a dump file.
- Markdown files are stored as MDC AST
- YAML and JSON files are stored as pure json
- Drafts files and meta are stored client-side in IndexedDB
- Drafts files content is merged with the existing db files in the browser before being rendered => app is rerendered with updated content in db => this is the preview you see in the browser

**In development mode:**
- There is no draft system, changes are synced with the server filesystem directly

### External helpers

#### nuxt-component-meta

Studio uses `nuxt-component-meta` to:
- Discover available components in the user's project
- Find props editors for components
- Find slots for components

#### @nuxtjs/mdc

Studio uses `@nuxtjs/mdc` to:
- Parse MDC syntax
- Render MDC syntax
- Generate MDC AST

#### shiki

Studio uses `shiki` to highlight code in code blocks.

#### Nuxt Content

- Gives information about the content of the website and the collections.
- Provides the database adapter to the Studio.
- Provides the content collections to the Studio.
- Provides the schema of the collections to the Studio (form generation)
- Provides the query builder to the Studio.

### Server Routes

**Development Mode**:
- `/__nuxt_studio/dev/content/*` - File operations
- `/__nuxt_studio/dev/public/*` - Media operations

**Production Mode**:
- `/__nuxt_studio/auth/*` - OAuth callbacks
- Service routes use Git provider APIs

## Important Files

- [src/module/src/module.ts](src/module/src/module.ts) - Main module definition
- [src/module/src/auth.ts](src/module/src/auth.ts) - Auth provider setup
- [src/module/src/dev.ts](src/module/src/dev.ts) - Dev mode configuration
- [src/app/src/main.ts](src/app/src/main.ts) - Vue app entry point
- [src/app/src/service-worker.ts](src/app/src/service-worker.ts) - Service worker for media draft system
- [src/module/src/runtime/server/routes/](src/module/src/runtime/server/routes/) - Server routes

## Common Tasks

### Adding a New Auth Provider

1. Add OAuth config to [src/module/src/auth.ts](src/module/src/auth.ts)
2. Create server route in `src/module/src/runtime/server/routes/auth/`
3. Add provider type to types
4. Update docs

### Adding a New Git Provider

1. Create provider implementation in `src/app/src/utils/providers/`
2. Add provider API client
3. Update Git provider types
4. Add configuration options

### Adding a Custom Form Input

1. Define input type in collection schema using `.editor({ input: 'custom' })`
2. Extend Zod schema types
3. Create corresponding form component
4. Map input type in form generator

## Key Dependencies

**Required**:
- `@nuxt/content` - Content layer (peer dependency)
- `@nuxtjs/mdc` - MDC parsing/rendering

**Core**:
- `unstorage` - Storage abstraction
- `idb-keyval` - IndexedDB for drafts
- `shiki` - Syntax highlighting

**Editors**:
- `modern-monaco` - Code editor
- `minimark` - Markdown processing (TipTap)

**Git Providers**:
- `@octokit/types` - GitHub API
- `@gitbeaker/core` - GitLab API

## SSR Requirements

Studio requires server-side rendering for authentication routes. While you can pre-render pages with `nitro.prerender`, the site must be deployed on a platform that supports SSR (not static hosting like GitHub Pages).

Use hybrid rendering to pre-render pages while keeping auth routes server-side:

```ts
export default defineNuxtConfig({
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true
    }
  }
})
```

## Related Documentation

- [Nuxt Content](https://content.nuxt.com/) - Underlying content management
- [MDC Syntax](https://content.nuxt.com/docs/files/markdown#mdc-syntax) - Component syntax in Markdown
- [Nuxt Content Collections](https://content.nuxt.com/docs/collections/define) - Schema-based content
- [TipTap Editor](https://tiptap.dev/) - Visual editor framework
- [Official Studio Docs](https://nuxt.studio/) - User-facing documentation

## Debugging Tips

- Enable debug mode in footer menu to see TipTap JSON ↔ MDC AST ↔ Markdown conversion
- Check browser IndexedDB for draft storage
- Use Vue DevTools to inspect Studio state
- Check service worker logs for medias issues
- Verify OAuth callback URLs match exactly (including protocol)
- Ensure PAT has correct permissions for repository operations

## Assumptions for AI Assistants

- Nuxt Studio always runs **inside** a Nuxt app
- Nuxt Content is required and authoritative for content structure
- Studio does not replace Nuxt Content querying or rendering
- All persisted changes ultimately go through Git (for the moment)
- Temporary changes are stored in IndexedDB and synced with the SQLite db in production mode and sync with filesystem in development mode
- The Studio UI is a separate Vue x Vite app embedded via the Nuxt module
