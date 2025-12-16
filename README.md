# Nuxt Studio

![npm version](https://img.shields.io/npm/v/nuxt-studio/beta.svg?style=flat\&colorA=020420\&colorB=EEEEEE)![npm downloads](https://img.shields.io/npm/dm/nuxt-studio.svg?style=flat\&colorA=020420\&colorB=EEEEEE)![License](https://img.shields.io/npm/l/nuxt-studio.svg?style=flat\&colorA=020420\&colorB=EEEEEE)

Visual edition in production for your [Nuxt Content](https://content.nuxt.com) website.

Originally offered as a standalone premium platform at <https://nuxt.studio>, Studio has evolved into a free, open-source, and self-hostable Nuxt module. Enable your entire team to edit website content right in production.

**Current Features** `BETA`

- 💻 **Monaco Code Editor** - Code editor for enhanced Markdown with MDC syntax, YAML, and JSON
- ✨ **TipTap Visual Editor** - WYSIWYG Markdown editor with MDC component support (default mode)
- 📝 **Form-based Editor** - Edit YAML/JSON files and frontmatter with auto-generated forms based on collection schemas
- 🔄 **Real-time Preview** - See your changes instantly on your production website
- 🔐 **Multi-provider Authentication** - Secure OAuth-based login with GitHub, GitLab, and Google
- 📝 **File Management** - Create, edit, delete, and rename content files (`content/` directory)
- 🖼️ **Media Management** - Centralized media library with support for JPEG, PNG, GIF, WebP, AVIF, SVG, and more
- 🌳 **Git Integration** - Commit changes directly from your production website and just wait your CI/CD pipeline to deploy your changes
- 🚀 **Development Mode** - Directly edit your content files and media files in your local filesystem using the module interface
- 🌍 **16 Languages** - Full i18n support (AR, BG, DE, EN, ES, FA, FI, FR, ID, IT, JA, NL, PL, PT-BR, UA, ZH)

**Coming in Beta:**

- 🎨 **Vue Component Props Editor** - Visual interface for editing Vue component props and slots

**Future Features:**

- 📂 **Collections view** - View and manage your content collections in a unified interface
- 🖼️ **Media optimization** - Optimize your media files in the editor
- 🤖 **AI Content Assistant** — Receive smart, AI-powered suggestions to enhance your content creation flow
- 💡 **Community-driven Features** — Have an idea? [Share your suggestions](https://github.com/nuxt-content/studio/discussions) to shape the future of Nuxt Studio

### Resources

- [📖 Documentation](https://content.nuxt.com/docs/studio/setup)
- [🎮 Live Demo](https://docus.dev/admin)

## Quick Setup

### 1. Install

Install the module in your Nuxt application:

```bash
npx nuxi module add nuxt-studio@beta
```

### 2. Dev Mode

🚀 **That's all you need to enable Studio locally!**

Run your Nuxt app and navigate to `/_studio` to start editing. Any file changes will be synchronized in real time with the file system.

> **Note**: The publish system is only available in production mode. Use your classical workflow (IDE, CLI, GitHub Desktop...) to publish your changes locally.

### 3. Configure Production

Add it to your `nuxt.config.ts` and configure your repository:

```ts
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-studio'
  ],
  
  studio: {
    // Studio admin route (default: '/_studio')
    route: '/_studio',
    
    // Git repository configuration (owner and repo are required)
    repository: {
      provider: 'github', // 'github' or 'gitlab'
      owner: 'your-username', // your GitHub/GitLab username or organization
      repo: 'your-repo', // your repository name
      branch: 'main', // the branch to commit to (default: main)
    }
  }
})
```

### 4. Production Mode

To enable publishing directly from your production website, you need to configure OAuth authentication.

#### Choose your Oauth provider

> [Browse the official documentation to configure the provider you want to use.](https://content.nuxt.com/docs/studio/providers)

#### Deployment

Nuxt Studio requires server-side routes for authentication. Your site must be **deployed on a platform that supports SSR** using `nuxt build`.

If you want to pre-render all your pages, use hybrid rendering:

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

## Configuration Options

```ts
export default defineNuxtConfig({
  studio: {
    // Studio admin login route
    route: '/_studio', // default

    // Git repository configuration
    repository: {
      provider: 'github', // 'github' or 'gitlab' (default: 'github')
      owner: 'your-username', // your GitHub/GitLab owner (required)
      repo: 'your-repo', // your repository name (required)
      branch: 'main', // branch to commit to (default: 'main')
      rootDir: '', // subdirectory for monorepos (default: '')
      private: true, // request access to private repos (default: true)
    },
  }
})
```

## Contributing

You can start contributing by cloning the repository and using the playground in dev mode (set `dev` option to `true`).

> If you want to contribute with production mode you must create a local GitHub OAuth App (pointing to `http://localhost:3000` as callback URL).

### Development Setup

```bash
# Install dependencies
pnpm install

# Generate type stubs
pnpm dev:prepare

# Build the app and service worker
pnpm prepack

# Terminal 1: Start the playground
pnpm dev

# Terminal 2: Start the app dev server
pnpm dev:app

# Login at http://localhost:3000/admin
```

### Project Structure

```text
studio/
├── src/
│   ├── app/           # Studio editor Vue app
│   └── module/        # Nuxt module
├── playground/        # Development playground
│   ├── docus/         # Docus example
│   └── minimal/       # Minimal example
```

### Testing

You can run a global command to test all needed check at once.

```bash
# Global verify running all needed commands
pnpm verify
```

Or run them one by one.

```bash
# Run tests
pnpm test

# Run type checking
pnpm typecheck

# Run linter
pnpm lint
```

## Roadmap

### ✅ Phase 1 - Alpha (Current)

- [x] Monaco code editor
- [x] TipTap visual editor with MDC support (default mode)
- [x] Editor mode switching (code ↔ visual/form)
- [x] Form-based editor for YAML/JSON and frontmatter (schema-based)
- [x] File operations (create, edit, delete, rename)
- [x] Media management with visual picker
- [x] Enhanced component slot editing
- [x] GitHub authentication
- [x] GitLab provider support
- [x] Google OAuth authentication
- [x] Development mode
- [x] Git integration
- [x] Real-time preview
- [x] Internationalization (16 languages)

### 🚧 Phase 2 - Beta (In Development)

- [ ] Vue Component props editor (visual interface)
- [ ] Provide utilities to allow users to handle their own authentication

### 🔮 Future

- [ ] Advanced conflict resolution
- [ ] Pull request generation (from a branch to the main one)
- [ ] AI-powered content suggestions
- [ ] Media optimization

## Links

- 📖 [Documentation](https://content.nuxt.com/studio)
- 🐛 [Report a Bug](https://github.com/nuxt-content/studio/issues/new)
- 💡 [Feature Request](https://github.com/nuxt-content/studio/issues/new)
- 🗨️ [Discussions](https://github.com/nuxt-content/studio/discussions)
- 🆇 [Twitter](https://x.com/nuxtstudio)
- 🦋 [Bluesky](https://bsky.app/profile/nuxt.com)

## License

Published under the [MIT](LICENSE) license.
