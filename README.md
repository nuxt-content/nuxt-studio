# Nuxt Studio

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]

Visual edition in production for your [Nuxt Content](https://content.nuxt.com) website.

Originally offered as a standalone premium platform, Studio has evolved into a free, open-source, and self-hostable Nuxt module. Enable your entire team to edit website content right in production.

https://github.com/user-attachments/assets/39bf4250-e72b-45aa-bf6d-9441a38cb2d5

**Current Features**

- 💻 **Monaco Code Editor** - Code editor for enhanced Markdown with MDC syntax, YAML, and JSON
- ✨ **TipTap Visual Editor** - Markdown editor with MDC component support (default mode)
- 📝 **Form-based Editor** - Edit YAML/JSON files and frontmatter with auto-generated forms based on collection schemas
- 🎨 **Vue Component Props Editor** - Visual interface for editing Vue component props directly in the editor
- 🧠 **AI-powered content suggestions** - Plug and play DX with the Vercel AI Gateway, let AI help you shape your content. 
- 🔄 **Real-time Preview** - See your changes instantly on your production website
- 🔐 **Multi-provider Authentication** - Secure OAuth-based login with GitHub, GitLab, and Google
- 🔑 **Custom Authentication** - Utilities for implementing your own auth flow (password, SSO, LDAP)
- 📝 **File Management** - Create, edit, delete, and rename content files (`content/` directory)
- 🖼️ **Media Management** - Centralized media library with support for JPEG, PNG, GIF, WebP, AVIF, SVG, and more
- 🌳 **Git Integration** - Commit changes directly from your production website and just wait your CI/CD pipeline to deploy your changes
- 🚀 **Development Mode** - Directly edit your content files and media files in your local filesystem using the module interface
- 🌍 **25 Languages** - Full i18n support (AR, BG, BN, CS, DE, EN, ES, FA, FI, FR, ID, IT, JA, KO, NB-NO, NL, NN-NO, PL, PT-BR, RU, TH, UA, ZH, ZH-TW)

**Future Features:**

- 📂 **Collections view** - View and manage your content collections in a unified interface
- 🖼️ **Media optimization** - Optimize your media files in the editor
- 🤖 **AI Content Assistant** — Receive smart, AI-powered suggestions to enhance your content creation flow
- 💡 **Community-driven Features** — Have an idea? [Share your suggestions](https://github.com/nuxt-content/nuxt-studio/discussions) to shape the future of Nuxt Studio

### Resources

- [📖 Documentation](https://nuxt.studio/)
- [🎮 Live Demo](https://docus.dev/admin)

## Quick Setup

### 1. Install

Install the module in your Nuxt application:

```bash
npx nuxi module add nuxt-studio
```

### 2. Dev Mode

🚀 **That's all you need to enable Studio locally!**

Run your Nuxt app and you will see a floating button on bottom left for editing your content. Any file changes will be synchronized in real time with the file system.

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

To enable publishing directly from your production website, you need to configure:

#### Git Provider

Configure where your content is stored (GitHub or GitLab repository). See the [repository configuration](#configuration-options) above.

> [📖 Git Providers Documentation](https://nuxt.studio/git-providers)

#### Auth Provider

Configure how users authenticate to access Studio. Choose from GitHub, GitLab, Google OAuth, or custom authentication.

```bash
# Example with GitHub OAuth
STUDIO_GITHUB_CLIENT_ID=<your_client_id>
STUDIO_GITHUB_CLIENT_SECRET=<your_client_secret>
```

> [📖 Auth Providers Documentation](https://nuxt.studio/auth-providers)

#### Deployment

Nuxt Studio requires server-side routes for authentication. Your site must be **deployed on a platform that supports SSR** using `nuxt build`.

#### Open Studio

Once deployed, navigate to your configured route (default: `/_studio`) and authenticate to start editing.

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

### ✅ Phase 1 (Completed)

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
- [x] Internationalization (25 languages)
- [x] Custom authentication utilities
- [x] Vue Component props editor (visual interface)
- [x] Span-style text formatting with toolbar button
- [x] Binding extension for component prop editing

### 🔮 Future

- [ ] Advanced conflict resolution
- [ ] Pull request generation (from a branch to the main one)
- [x] AI-powered content suggestions
- [ ] Media optimization

## Links

- 📖 [Documentation](https://content.nuxt.com/studio)
- 🐛 [Report a Bug](https://github.com/nuxt-content/nuxt-studio/issues/new)
- 💡 [Feature Request](https://github.com/nuxt-content/nuxt-studio/issues/new)
- 🗨️ [Discussions](https://github.com/nuxt-content/nuxt-studio/discussions)
- 🆇 [Twitter](https://x.com/nuxtstudio)
- 🦋 [Bluesky](https://bsky.app/profile/nuxt.com)

## License

Published under the [MIT](LICENSE) license.

[npm-version-src]: https://img.shields.io/npm/v/nuxt-studio?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-studio

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-studio.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-studio

[license-src]: https://img.shields.io/npm/l/nuxt-studio.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-studio
