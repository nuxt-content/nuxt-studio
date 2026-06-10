import { useLogger } from '@nuxt/kit'
import type { ModuleOptions } from './module'

const logger = useLogger('nuxt-studio')

export function validateAuthConfig(options: ModuleOptions): void {
  const provider = options.repository?.provider || 'github'

  const hasGitHubAuth = options.auth?.github?.clientId && options.auth?.github?.clientSecret
  const hasGitLabAuth = options.auth?.gitlab?.applicationId && options.auth?.gitlab?.applicationSecret
  const hasGoogleAuth = options.auth?.google?.clientId && options.auth?.google?.clientSecret
  const hasSSOServer = options.auth?.sso?.serverUrl && options.auth?.sso?.clientId && options.auth?.sso?.clientSecret

  if (hasSSOServer) {
    return
  }

  if (hasGoogleAuth) {
    return
  }

  const missingProviderAuth = provider === 'github' ? !hasGitHubAuth : !hasGitLabAuth
  if (missingProviderAuth) {
    logger.warn([
      `In order to use Studio in production mode, you need to setup authentication:`,
      '- Read more on `https://nuxt.studio/auth-providers`',
      `- Alternatively, you can disable studio by setting \`$production: { studio: false }\` in your \`nuxt.config.ts\``,
    ].join('\n'))
  }
}
