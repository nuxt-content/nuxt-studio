import { useLogger } from '@nuxt/kit'
import type { ModuleOptions } from './module'

const logger = useLogger('Nuxt Studio')

export function validateAuthConfig(options: ModuleOptions): void {
  const provider = options.repository?.provider || 'github'
  const providerUpperCase = provider.toUpperCase()

  const hasGitHubAuth = options.auth?.github?.clientId && options.auth?.github?.clientSecret
  const hasGitLabAuth = options.auth?.gitlab?.applicationId && options.auth?.gitlab?.applicationSecret
  const hasGoogleAuth = options.auth?.google?.clientId && options.auth?.google?.clientSecret
  const hasSSOServer = options.auth?.sso?.serverUrl && options.auth?.sso?.clientId && options.auth?.sso?.clientSecret

  // SSO server enabled - GitHub token is passed through from SSO when users login with GitHub
  if (hasSSOServer) {
    return
  }

  // Git Token is enough for custom authentication — it can be supplied at runtime via
  // STUDIO_GITHUB_TOKEN / STUDIO_GITLAB_TOKEN or NUXT_STUDIO_GIT_GITHUB_TOKEN so we
  // can't reliably check it at build time.  Skip the guard here and let the auth route
  // handlers surface a clear error at request time when no token is present.

  // Google OAuth enabled
  if (hasGoogleAuth) {
    // Google OAuth moderators are required but may be supplied at runtime via
    // STUDIO_GOOGLE_MODERATORS — warn at build time when they're not in nuxt.config,
    // but don't error (they may be set in the deployment environment).
    const hasGoogleModeratorsInConfig = (options.auth?.google as { moderators?: string })?.moderators
    if (!hasGoogleModeratorsInConfig) {
      logger.warn([
        'Google OAuth moderators are required when using Google OAuth.',
        'Set `auth.google.moderators` in nuxt.config.ts or supply the `STUDIO_GOOGLE_MODERATORS`',
        'environment variable (comma-separated list of allowed email addresses) at runtime.',
        'Only users with these email addresses will be able to access Studio with Google OAuth.',
      ].join('\n'))
    }

    // A PAT is required for pushing changes — remind at build time, but it may be runtime-supplied.
    logger.info([
      `A \`STUDIO_${providerUpperCase}_TOKEN\` (or \`NUXT_STUDIO_GIT_${providerUpperCase}_TOKEN\`) is required`,
      `when using Google OAuth with the ${providerUpperCase} provider so Studio can push changes to the repository.`,
    ].join(' '))
  }
  // Google OAuth disabled => GitHub or GitLab OAuth required (or runtime-supplied token)
  else {
    const hasProviderAuth = provider === 'github' ? hasGitHubAuth : hasGitLabAuth
    if (!hasProviderAuth) {
      logger.warn([
        `In order to use Studio in production mode, you need to setup authentication:`,
        '- Read more on `https://nuxt.studio/auth-providers`',
        `- Alternatively, you can disable studio by setting \`$production: { studio: false }\` in your \`nuxt.config.ts\``,
        `- Auth credentials can also be supplied at runtime via STUDIO_${providerUpperCase}_CLIENT_ID / STUDIO_${providerUpperCase}_CLIENT_SECRET`,
        `  or a personal access token via STUDIO_${providerUpperCase}_TOKEN.`,
      ].join('\n'))
    }
  }
}
