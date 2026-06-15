import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createHash } from 'node:crypto'
import { defu } from 'defu'
import { detectRepositoryFromCI } from '../utils/repository'

// Detect repository from CI / platform env vars once at server startup.
// VERCEL_GIT_* and Netlify vars are available at runtime; GitHub Actions / GitLab CI
// vars are typically build-time only — use explicit nuxt.config or NUXT_PUBLIC_STUDIO_REPOSITORY_*
// for those deployments.
const ciRepository = detectRepositoryFromCI()

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  if (!config.studio) return

  // Reflect actual runtime AI availability in the public config so the editor UI is accurate
  if (config.public?.studio?.ai) {
    config.public.studio.ai.enabled = Boolean(config.studio.ai?.apiKey)
  }

  // Repository — CI detection wins for non-provider fields; provider only set if unset.
  // Mirrors the original build-time precedence, now resolved at runtime.
  if (ciRepository && config.public?.studio?.repository !== undefined) {
    const { provider: detectedProvider, ...detectedWithoutProvider } = ciRepository
    config.public.studio.repository = defu(detectedWithoutProvider, config.public.studio.repository)
    config.studio.repository = defu(detectedWithoutProvider, config.studio.repository)
    if (!config.public.studio.repository.provider && detectedProvider) {
      config.public.studio.repository.provider = detectedProvider
    }
    if (!config.studio.repository.provider && detectedProvider) {
      config.studio.repository.provider = detectedProvider
    }
  }

  // Derive session secret from resolved credentials when none is explicitly set
  if (!config.studio.auth.sessionSecret) {
    const credValues = [
      config.studio.auth.github?.clientId,
      config.studio.auth.github?.clientSecret,
      config.studio.auth.gitlab?.applicationId,
      config.studio.auth.gitlab?.applicationSecret,
      config.studio.auth.google?.clientId,
      config.studio.auth.google?.clientSecret,
      config.studio.auth.sso?.serverUrl,
      config.studio.auth.sso?.clientId,
      config.studio.auth.sso?.clientSecret,
      config.studio.git?.githubToken,
      config.studio.git?.gitlabToken,
    ]
    if (credValues.some(Boolean)) {
      config.studio.auth.sessionSecret = createHash('md5').update(credValues.join('')).digest('hex')
    }
  }
})
