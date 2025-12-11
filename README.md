# Nuxt Studio

[![npm version](https://img.shields.io/npm/v/nuxt-studio/alpha.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/nuxt-studio)
[![npm downloads](https://img.shields.io/npm/dm/nuxt-studio.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npm.chart.dev/nuxt-studio)
[![License](https://img.shields.io/npm/l/nuxt-studio.svg?style=flat&colorA=020420&colorB=EEEEEE)](https://npmjs.com/package/nuxt-studio)

---

## ⚠️ Alpha Version

> **Current Status: Alpha Testing**
>
> Nuxt Studio is currently in **alpha** and now includes both the Monaco code editor and the new **TipTap visual editor** for Markdown content. This phase focuses on testing and stabilizing core functionality:
>
> - ✅ File operations (create, edit, delete, rename)
> - ✅ Content editing with Monaco code editor
> - ✅ **NEW:** Visual editing with TipTap editor for Markdown
> - ✅ Media management and uploads
> - ✅ GitHub authentication and publishing workflow
>
>
> The TipTap visual editor provides a WYSIWYG editing experience for Markdown content, including support for MDC components, with seamless conversion between visual and code modes.
>
> Read the [announcement blog post](https://content.nuxt.com/blog/studio-module-alpha) for more details.

---

Visual edition in production for your [Nuxt Content](https://content.nuxt.com) website.

Originally offered as a standalone premium platform at https://nuxt.studio, Studio has evolved into a free, open-source, and self-hostable Nuxt module. Enable your entire team to edit website content right in production.

**Current Features (Alpha):**

- 💻 **Monaco Code Editor** - Code editor for enhanced Markdown with MDC syntax, YAML, and JSON
- ✨ **TipTap Visual Editor** - Markdown editor with MDC component support
- 🔄 **Real-time Preview** - See your changes instantly on your production website
- 🔐 **GitHub Authentication** - Secure OAuth-based login with GitHub
- 📝 **File Management** - Create, edit, delete, and rename content files (`content/` directory)
- 🖼️ **Media Management** - Centralized media library for all your assets (`public/` directory) with visual media picker
- 🌳 **Git Integration** - Commit changes directly from your production website and just wait your CI/CD pipeline to deploy your changes
- 🚀 **Development Mode** - Directly edit your content files and media files in your local filesystem using the module interface

**Coming in Beta:**
- 📝 **Frontmatter Form Editor** - Edit frontmatter metadata with auto-generated forms based on collection schemas
- 🎨 **Vue Component Props Editor** - Visual interface for editing Vue component props and slots
- 🔐 **Google OAuth Authentication** - Secure OAuth-based login with Google

**Future Features:**
- 📂 **Collections view** - View and manage your content collections in a unified interface
- 🖼️ **Media optimization** - Optimize your media files in the editor
- 🤖 **AI Content Assistant** — Receive smart, AI-powered suggestions to enhance your content creation flow
- 💡 **Community-driven Features** — Have an idea? [Share your suggestions](https://github.com/nuxt-content/studio/discussions) to shape the future of Nuxt Studio

### Resources
- [📖 Documentation](https://content.nuxt.com/docs/studio/setup)
- [🎮 Live Demo](https://docus.dev/admin)

## Quick Setup

> **Note**: This alpha release provides both a Monaco code editor and a TipTap visual WYSIWYG editor for Markdown content. You can switch between them at any time.

### 1. Install

Install the module in your Nuxt application:

```bash
npx nuxi module add nuxt-studio@alpha
```

### 2. Configure

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

### 3. Dev Mode

🚀 **That's all you need to enable Studio locally!**

Run your Nuxt app and navigate to `/_studio` to start editing. Any file changes will be synchronized in real time with the file system.

> **Note**: The publish system is only available in production mode. Use your classical workflow (IDE, CLI, GitHub Desktop...) to publish your changes locally.

### 4. Production Mode

To enable publishing directly from your production website, you need to configure OAuth authentication.

#### Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name**: Your App Name
   - **Homepage URL**: Your website homepage URL
   - **Authorization callback URL**: `${YOUR_WEBSITE_URL}/_studio/auth/github`
4. Copy the **Client ID** and generate a **Client Secret**
5. Add them to your deployment environment variables:

```bash
STUDIO_GITHUB_CLIENT_ID=your_github_client_id
STUDIO_GITHUB_CLIENT_SECRET=your_github_client_secret
```

> **Note**: GitLab is also supported. See the [providers documentation](https://content.nuxt.com/docs/studio/providers) for setup instructions.

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
You must clone the repository and create a local GitHub OAuth App (pointing to `http://localhost:3000` as callback URL).

Set your GitHub OAuth credentials in the `.env` file.

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

```
studio/
├── src/
│   ├── app/           # Studio editor Vue app
│   └── module/        # Nuxt module
├── playground/        # Development playground
│   ├── docus/         # Docus example
│   └── minimal/       # Minimal example
```

### Testing

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
- [x] TipTap visual editor with MDC support
- [x] Editor mode switching (code ↔ visual)
- [x] File operations (create, edit, delete, rename)
- [x] Media management with visual picker
- [x] Enhanced component slot editing
- [x] GitHub authentication
- [x] GitLab provider support
- [x] Development mode (**experimental**)
- [x] Git integration
- [x] Real-time preview
- [x] Google OAuth authentication

### 🚧 Phase 2 - Beta (In Development)
- [ ] Frontmatter edition as form (schema-based)
- [ ] YAML and JSON edition as form (schema-based)
- [ ] Vue Component props editor (visual interface)

### 🔮 Future

- [ ] Other provider support
- [ ] Advanced conflict resolution
- [ ] Pull request generation (from a branch to the main one)
- [ ] AI-powered content suggestions

## Links

- 📖 [Documentation](https://content.nuxt.com/studio)
- 🐛 [Report a Bug](https://github.com/nuxt-content/studio/issues/new)
- 💡 [Feature Request](https://github.com/nuxt-content/studio/issues/new)
- 🗨️ [Discussions](https://github.com/nuxt-content/studio/discussions)
- 🆇 [Twitter](https://x.com/nuxtstudio)
- 🦋 [Bluesky](https://bsky.app/profile/nuxt.com)

## License

Published under the [MIT](LICENSE) license.
