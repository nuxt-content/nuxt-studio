import { useLogger } from '@nuxt/kit'
import type { ModuleOptions } from './module'

const logger = useLogger('Nuxt Studio')

export function validateAuthConfig(options: ModuleOptions): void {
  const provider = options.repository?.provider || 'github'
  const providerUpperCase = provider.toUpperCase()

  // Git Token is enough for custom authentication
  const hasGitToken = process.env.STUDIO_GITHUB_TOKEN || process.env.STUDIO_GITLAB_TOKEN
  if (hasGitToken) {
    return
  }

  const hasGitHubAuth = options.auth?.github?.clientId && options.auth?.github?.clientSecret
  const hasGitLabAuth = options.auth?.gitlab?.applicationId && options.auth?.gitlab?.applicationSecret
  const hasGoogleAuth = options.auth?.google?.clientId && options.auth?.google?.clientSecret
  const hasSSOServer = options.auth?.sso?.serverUrl && options.auth?.sso?.clientId && options.auth?.sso?.clientSecret
  const hasGoogleModerators = (process.env.STUDIO_GOOGLE_MODERATORS?.split(',') || []).length > 0

  // SSO server enabled - GitHub token is passed through from SSO when users login with GitHub
  if (hasSSOServer) {
    return
  }

  // Google OAuth enabled
  if (hasGoogleAuth) {
    // Google OAuth moderators required
    if (!hasGoogleModerators) {
      logger.error([
        'The `STUDIO_GOOGLE_MODERATORS` environment variable is required when using Google OAuth.',
        'Please set the `STUDIO_GOOGLE_MODERATORS` environment variable to a comma-separated list of email of the allowed users.',
        'Only users with these email addresses will be able to access studio with Google OAuth.',
      ].join('\n'))
    }

    // PAT required for pushing changes to the repository
    if (!hasGitToken) {
      logger.warn([
        `The \`STUDIO_${providerUpperCase}_TOKEN\` environment variable is required when using Google OAuth with ${providerUpperCase} provider.`,
        `This token is used to push changes to the repository when using Google OAuth.`,
      ].join('\n'))
    }
  }
  // Google OAuth disabled => GitHub or GitLab OAuth required
  else {
    const missingProviderEnv = provider === 'github' ? !hasGitHubAuth : !hasGitLabAuth
    if (missingProviderEnv) {
      logger.warn([
        `In order to use Studio in production mode, you need to setup authentication:`,
        '- Read more on `https://nuxt.studio/auth-providers`',
        `- Alternatively, you can disable studio by setting \`$production: { studio: false }\` in your \`nuxt.config.ts\``,
      ].join('\n'))
    }
  }
}
