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

  if (hasSSOServer) {
    return
  }

  if (hasGoogleAuth) {
    const hasGoogleModeratorsInConfig = (options.auth?.google as { moderators?: string })?.moderators
    if (!hasGoogleModeratorsInConfig) {
      logger.warn([
        'Google OAuth moderators are required when using Google OAuth.',
        'Set `auth.google.moderators` in nuxt.config.ts or supply `NUXT_STUDIO_AUTH_GOOGLE_MODERATORS`',
        '(comma-separated list of allowed email addresses) at runtime.',
        'Only users with these email addresses will be able to access Studio with Google OAuth.',
      ].join('\n'))
    }
    logger.info([
      `A \`NUXT_STUDIO_GIT_${providerUpperCase}_TOKEN\` is required when using Google OAuth`,
      `so Studio can push changes to the ${providerUpperCase} repository.`,
    ].join(' '))
  }
  else {
    const hasProviderAuth = provider === 'github' ? hasGitHubAuth : hasGitLabAuth
    if (!hasProviderAuth) {
      logger.warn([
        'In order to use Studio in production mode, you need to setup authentication:',
        '- Read more on `https://nuxt.studio/auth-providers`',
        '- Alternatively, you can disable studio by setting `$production: { studio: false }` in your `nuxt.config.ts`',
        `- Auth credentials can also be supplied at runtime via NUXT_STUDIO_AUTH_${providerUpperCase}_CLIENT_ID / NUXT_STUDIO_AUTH_${providerUpperCase}_CLIENT_SECRET`,
        `  or a personal access token via NUXT_STUDIO_GIT_${providerUpperCase}_TOKEN.`,
      ].join('\n'))
    }
  }
}
