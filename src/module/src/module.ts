import { defineNuxtModule, createResolver, addPlugin, extendViteConfig, addServerHandler, addTemplate, addServerImports, useLogger } from '@nuxt/kit'
import { createHash } from 'node:crypto'
import { defu } from 'defu'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import fsDriver from 'unstorage/drivers/fs'
import { createStorage } from 'unstorage'
import { getAssetsStorageDevTemplate, getAssetsStorageTemplate } from './templates'
import { version } from '../../../package.json'
import { setupDevMode } from './dev'
import { validateAuthConfig } from './auth'

const logger = useLogger('nuxt-studio')

interface MetaOptions {
  /**
   * Component filtering options.
   */
  components?: {
    /**
     * Patterns to include components.
     * If a pattern contains a /, it will be treated as a path filter.
     * Otherwise, it will be treated as a name filter.
     */
    include?: string[]
    /**
     * Patterns to exclude components.
     * If a pattern contains a /, it will be treated as a path filter.
     * Otherwise, it will be treated as a name filter.
     */
    exclude?: string[]
  }
  /**
   * The markdown configuration.
   */
}

interface RepositoryOptions {
  /**
   * The owner of the git repository.
   */
  owner?: string
  /**
   * The repository name.
   */
  repo?: string
  /**
   * The branch to use for the git repository.
   * @default 'main'
   */
  branch?: string
  /**
   * The root directory to use for the git repository.
   * @default ''
   */
  rootDir?: string
  /**
   * Whether the repository is private or public.
   * If set to false, the 'public_repo' scope will be used instead of the 'repo' scope.
   * @default true
   */
  private?: boolean
}

interface GitHubRepositoryOptions extends RepositoryOptions {
  provider: 'github'
}

interface GitLabRepositoryOptions extends RepositoryOptions {
  provider: 'gitlab'
  instanceUrl?: string
}

export interface ModuleOptions {
  /**
   * The route to access the studio login page.
   * @default '/_studio'
   */
  route?: string

  /**
   * AI-powered content generation settings.
   */
  ai?: {
    /**
     * The Vercel API Gateway key for AI features.
     * When set, AI-powered content generation will be enabled.
     * @default process.env.AI_GATEWAY_API_KEY
     */
    apiKey?: string
    /**
     * Contextual information to guide AI content generation.
     */
    context?: {
      /**
       * The title of the project.
       * @default Reads from package.json name field
       */
      title?: string
      /**
       * The description of the project.
       * @default Reads from package.json description field
       */
      description?: string
      /**
       * The writing style to use (e.g., "technical documentation", "blog post", "marketing copy").
       */
      style?: string
      /**
       * The tone to use (e.g., "friendly and concise", "formal and professional", "casual").
       */
      tone?: string
      /**
       * Collection configuration for storing AI context files.
       * Each collection can have its own CONTEXT.md file.
       */
      collection?: {
        /**
         * The name of the collection storing AI context files.
         * @default 'studio'
         */
        name?: string
        /**
         * The folder where context files are stored.
         * @default '.studio'
         */
        folder?: string
      }
    }
    /**
     * Experimental AI features.
     */
    experimental?: {
      /**
       * Enable loading collection-specific context files from the studio collection.
       * When enabled, AI will load writing guidelines from `.studio/{collection-name}.md`.
       * @default false
       */
      collectionContext?: boolean
    }
  }

  /**
   * The authentication settings for studio.
   */
  auth?: {
    /**
     * The GitHub OAuth credentials.
     */
    github?: {
      /**
       * The GitHub OAuth client ID.
       * @default process.env.STUDIO_GITHUB_CLIENT_ID
       */
      clientId?: string
      /**
       * The GitHub OAuth client secret.
       * @default process.env.STUDIO_GITHUB_CLIENT_SECRET
       */
      clientSecret?: string
    }
    /**
     * The GitLab OAuth credentials.
     */
    gitlab?: {
      /**
       * The GitLab OAuth application ID.
       * @default process.env.STUDIO_GITLAB_APPLICATION_ID
       */
      applicationId?: string
      /**
       * The GitLab OAuth application secret.
       * @default process.env.STUDIO_GITLAB_APPLICATION_SECRET
       */
      applicationSecret?: string
      /**
       * The GitLab instance URL (for self-hosted instances).
       * @default 'https://gitlab.com'
       */
      instanceUrl?: string
    }
    /**
     * The Google OAuth credentials.
     * Note: When using Google OAuth, you must set STUDIO_GOOGLE_MODERATORS to a comma-separated
     * list of authorized email addresses, and either STUDIO_GITHUB_TOKEN or STUDIO_GITLAB_TOKEN
     * to push changes to your repository.
     */
    google?: {
      /**
       * The Google OAuth client ID.
       * @default process.env.STUDIO_GOOGLE_CLIENT_ID
       */
      clientId?: string
      /**
       * The Google OAuth client secret.
       * @default process.env.STUDIO_GOOGLE_CLIENT_SECRET
       */
      clientSecret?: string
    }
    /**
     * SSO server credentials for Single Sign-On across multiple Nuxt Studio sites.
     * This enables authentication via a centralized SSO server (like nuxt-studio-sso).
     * When users authenticate with GitHub on the SSO server, their GitHub token is
     * automatically passed through, eliminating the need for STUDIO_GITHUB_TOKEN.
     */
    sso?: {
      /**
       * The SSO server URL (e.g., 'https://auth.example.com').
       * @default process.env.STUDIO_SSO_URL
       */
      serverUrl?: string
      /**
       * The SSO client ID.
       * @default process.env.STUDIO_SSO_CLIENT_ID
       */
      clientId?: string
      /**
       * The SSO client secret.
       * @default process.env.STUDIO_SSO_CLIENT_SECRET
       */
      clientSecret?: string
    }
  }
  /**
   * The git repository information to connect to.
   */
  repository?: GitHubRepositoryOptions | GitLabRepositoryOptions
  /**
   * Enable Nuxt Studio to edit content and media files on your filesystem.
   */
  dev: boolean
  /**
   * Enable Nuxt Studio to edit content and media files on your filesystem.
   *
   * @deprecated Use the 'dev' option instead.
   */
  development?: {
    sync?: boolean
  }
  /**
   * i18n settings for the Studio.
   */
  i18n?: {
    /**
     * The default locale to use.
     * @default 'en'
     */
    defaultLocale?: string
  }
  /**
   * Meta options.
   */
  meta?: MetaOptions
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-studio',
    configKey: 'studio',
    version,
    docs: 'https://content.nuxt.com/studio',
  },
  defaults: {
    dev: true,
    route: '/_studio',
    ai: {
      context: {
        title: '',
        description: '',
        style: '',
        tone: '',
        collection: {
          name: 'studio',
          folder: '.studio',
        },
      },
    },
    repository: {
      provider: 'github',
      owner: '',
      repo: '',
      branch: 'main',
      rootDir: '',
      private: true,
    },
    auth: {
      github: {
        clientId: process.env.STUDIO_GITHUB_CLIENT_ID,
        clientSecret: process.env.STUDIO_GITHUB_CLIENT_SECRET,
      },
      gitlab: {
        applicationId: process.env.STUDIO_GITLAB_APPLICATION_ID,
        applicationSecret: process.env.STUDIO_GITLAB_APPLICATION_SECRET,
        instanceUrl: process.env.STUDIO_GITLAB_INSTANCE_URL || process.env.CI_SERVER_URL || 'https://gitlab.com',
      },
      google: {
        clientId: process.env.STUDIO_GOOGLE_CLIENT_ID,
        clientSecret: process.env.STUDIO_GOOGLE_CLIENT_SECRET,
      },
      sso: {
        serverUrl: process.env.STUDIO_SSO_URL,
        clientId: process.env.STUDIO_SSO_CLIENT_ID,
        clientSecret: process.env.STUDIO_SSO_CLIENT_SECRET,
      },
    },
    i18n: {
      defaultLocale: 'en',
    },
    meta: {
      components: {
        include: [],
        exclude: [],
      },
    },
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtime = (...args: string[]) => resolver.resolve('./runtime', ...args)

    addServerImports([
      {
        name: 'setStudioUserSession',
        from: runtime('./server/utils/session'),
      },
      {
        name: 'clearStudioUserSession',
        from: runtime('./server/utils/session'),
      },
    ])

    if (nuxt.options.dev === false || options.development?.sync === false) {
      options.dev = false
    }

    // Auto-detect repository from CI environment variables when not explicitly configured
    const isProdBuild = nuxt.options.dev === false && nuxt.options._prepare === false
    if (isProdBuild && !options.repository?.owner && !options.repository?.repo) {
      const detected = detectRepositoryFromCI()
      if (detected) {
        options.repository = defu(detected, options.repository) as GitHubRepositoryOptions | GitLabRepositoryOptions
        logger.info(`Auto-detected repository from CI environment: ${detected.provider}:${detected.owner}/${detected.repo}#${detected.branch}`)
      }
    }

    if (isProdBuild && !options.repository?.owner && !options.repository?.repo) {
      throw new Error('Repository owner and repository name are required')
    }

    if (isProdBuild) {
      validateAuthConfig(options)
    }

    // Read AI API key from environment if not provided in options
    if (!options.ai?.apiKey && process.env.AI_GATEWAY_API_KEY) {
      options.ai = options.ai || {}
      options.ai.apiKey = process.env.AI_GATEWAY_API_KEY
    }

    // Default AI context
    const isAIEnabled = Boolean(options.ai?.apiKey)
    if (isAIEnabled) {
      let packageJsonContext: { title?: string, description?: string } = {}
      if (!options.ai!.context?.title || !options.ai!.context?.description) {
        // Read package.json for default title and description
        try {
          const pkgPath = resolve(nuxt.options.rootDir, 'package.json')
          const pkgContent = await readFile(pkgPath, 'utf-8')
          const pkg = JSON.parse(pkgContent)
          packageJsonContext = {
            title: pkg.name,
            description: pkg.description,
          }
        }
        catch { /* ignore errors reading package.json */ }
      }

      options.ai!.context!.title = options.ai!.context?.title || packageJsonContext.title
      options.ai!.context!.description = options.ai!.context?.description || packageJsonContext.description
    }

    // Enable checkoutOutdatedBuildInterval to detect new deployments
    nuxt.options.experimental = nuxt.options.experimental || {}
    nuxt.options.experimental.checkOutdatedBuildInterval = 1000 * 30

    nuxt.options.runtimeConfig.public.studio = {
      route: options.route!,
      dev: Boolean(options.dev),
      development: {
        server: process.env.STUDIO_DEV_SERVER,
      },
      ai: {
        enabled: Boolean(options.ai?.apiKey),
        context: {
          collectionName: options.ai?.context?.collection?.name as string,
          contentFolder: options.ai?.context?.collection?.folder as string,
        },
        experimental: {
          collectionContext: Boolean(options.ai?.experimental?.collectionContext),
        },
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
      // @ts-expect-error Autogenerated type does not match with options
      i18n: options.i18n,
    }

    nuxt.options.runtimeConfig.studio = {
      ai: {
        apiKey: options.ai?.apiKey,
        context: options.ai?.context as never,
        experimental: options.ai?.experimental,
      },
      auth: {
        sessionSecret: createHash('md5').update([
          options.auth?.github?.clientId,
          options.auth?.github?.clientSecret,
          options.auth?.gitlab?.applicationId,
          options.auth?.gitlab?.applicationSecret,
          options.auth?.google?.clientId,
          options.auth?.google?.clientSecret,
          options.auth?.sso?.serverUrl,
          options.auth?.sso?.clientId,
          options.auth?.sso?.clientSecret,
          process.env.STUDIO_GITHUB_TOKEN,
          process.env.STUDIO_GITLAB_TOKEN,
        ].join('')).digest('hex'),
        // @ts-expect-error autogenerated type doesn't match with project options
        github: options.auth?.github,
        // @ts-expect-error autogenerated type doesn't match with project options
        gitlab: options.auth?.gitlab,
        // @ts-expect-error autogenerated type doesn't match with project options
        google: options.auth?.google,
        // @ts-expect-error autogenerated type doesn't match with project options
        sso: options.auth?.sso,
      },
      // @ts-expect-error Autogenerated type does not match with options
      repository: options.repository,
      // @ts-expect-error Autogenerated type does not match with options
      meta: options.meta,
      // @ts-expect-error Autogenerated type does not match with options
      markdown: nuxt.options.content?.build?.markdown || {},
    }

    nuxt.options.vite = defu(nuxt.options.vite, {
      vue: {
        template: {
          compilerOptions: {
            isCustomElement: (tag: string) => tag === 'nuxt-studio',
          },
        },
      },
    })

    extendViteConfig((config) => {
      config.define ||= {}
      config.define['import.meta.preview'] = true

      config.optimizeDeps ||= {}
      config.optimizeDeps.include = [
        ...(config.optimizeDeps.include || []),
        'nuxt-studio > debug',
        'nuxt-studio > extend',
      ]

      // Support Shiki grammars
      config.build ||= {}
      config.build.target = 'es2020'
    })

    // Support Shiki grammars
    nuxt.options.nitro.esbuild ||= {}
    nuxt.options.nitro.esbuild.options ||= {}
    nuxt.options.nitro.esbuild.options.target = 'es2020'

    addPlugin(process.env.STUDIO_DEV_SERVER
      ? runtime('./plugins/studio.client.dev')
      : runtime('./plugins/studio.client'))

    const assetsStorage = createStorage({
      driver: fsDriver({
        base: resolve(nuxt.options.rootDir, 'public'),
      }),
    })

    addTemplate({
      filename: 'studio-public-assets.mjs',
      getContents: () => options.dev
        ? getAssetsStorageDevTemplate(assetsStorage, nuxt)
        : getAssetsStorageTemplate(assetsStorage, nuxt),
    })

    if (options.dev) {
      setupDevMode(nuxt, runtime, assetsStorage)
    }

    /* Server routes */
    addServerHandler({
      route: '/__nuxt_studio/auth/github',
      handler: runtime('./server/routes/auth/github.get'),
    })
    addServerHandler({
      route: '/__nuxt_studio/auth/google',
      handler: runtime('./server/routes/auth/google.get'),
    })
    addServerHandler({
      route: '/__nuxt_studio/auth/gitlab',
      handler: runtime('./server/routes/auth/gitlab.get'),
    })
    addServerHandler({
      route: '/__nuxt_studio/auth/sso',
      handler: runtime('./server/routes/auth/sso.get'),
    })
    addServerHandler({
      route: '/__nuxt_studio/auth/session',
      handler: runtime('./server/routes/auth/session.get'),
    })

    addServerHandler({
      method: 'delete',
      route: '/__nuxt_studio/auth/session',
      handler: runtime('./server/routes/auth/session.delete'),
    })

    addServerHandler({
      route: options.route as string,
      handler: runtime('./server/routes/admin'),
    })

    addServerHandler({
      route: '/__nuxt_studio/meta',
      handler: runtime('./server/routes/meta'),
    })

    addServerHandler({
      route: '/sw.js',
      handler: runtime('./server/routes/sw'),
    })

    if (isAIEnabled) {
      addServerHandler({
        method: 'post',
        route: '/__nuxt_studio/ai/generate',
        handler: runtime('./server/routes/ai/generate.post'),
      })

      addServerHandler({
        method: 'post',
        route: '/__nuxt_studio/ai/analyze',
        handler: runtime('./server/routes/ai/analyze.post'),
      })
    }
  },
})

/**
 * Auto-detect repository details from CI environment variables.
 * Supports Vercel, Netlify, GitHub Actions, and GitLab CI.
 */
function detectRepositoryFromCI(): GitHubRepositoryOptions | GitLabRepositoryOptions | undefined {
  // Vercel
  if (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG && ['github', 'gitlab'].includes(process.env.VERCEL_GIT_PROVIDER!)) {
    return {
      provider: process.env.VERCEL_GIT_PROVIDER as 'github' | 'gitlab',
      owner: process.env.VERCEL_GIT_REPO_OWNER,
      repo: process.env.VERCEL_GIT_REPO_SLUG,
      branch: process.env.VERCEL_GIT_COMMIT_REF,
    }
  }

  // Netlify
  if (process.env.NETLIFY && process.env.REPOSITORY_URL) {
    const match = process.env.REPOSITORY_URL.match(/(?:github\.com|gitlab\.com)[:/]([^/]+)\/([^/.]+)/)
    if (match?.[1] && match[2]) {
      const isGitLab = process.env.REPOSITORY_URL.includes('gitlab.com')
      return {
        provider: isGitLab ? 'gitlab' : 'github',
        owner: match[1],
        repo: match[2],
        branch: process.env.BRANCH,
      }
    }
  }

  // GitHub Actions
  if (process.env.GITHUB_ACTIONS && process.env.GITHUB_REPOSITORY?.includes('/')) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/') as [string, string]
    return {
      provider: 'github',
      owner,
      repo,
      branch: process.env.GITHUB_REF_NAME,
    }
  }

  // GitLab CI
  if (process.env.GITLAB_CI && process.env.CI_PROJECT_NAMESPACE && process.env.CI_PROJECT_NAME) {
    return {
      provider: 'gitlab',
      owner: process.env.CI_PROJECT_NAMESPACE,
      repo: process.env.CI_PROJECT_NAME,
      branch: process.env.CI_COMMIT_BRANCH,
      instanceUrl: process.env.CI_SERVER_URL,
    }
  }

  return undefined
}
