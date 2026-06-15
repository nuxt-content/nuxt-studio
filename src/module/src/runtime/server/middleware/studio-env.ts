import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createHash } from 'node:crypto'
import { defu } from 'defu'
import { mergeConfig } from '../utils/object'
import { detectRepositoryFromCI } from '../utils/repository'

// Read env vars once at server startup (module-import scope).
// useRuntimeConfig() (argless) is deep-frozen; useRuntimeConfig(event) returns
// a mutable per-request clone. Fill empty slots from legacy STUDIO_* / AI env vars
// here so NUXT_* overrides and explicit nuxt.config values take precedence.
const legacyEnvDefaults = {
  github: {
    clientId: process.env.STUDIO_GITHUB_CLIENT_ID,
    clientSecret: process.env.STUDIO_GITHUB_CLIENT_SECRET,
    redirectUrl: process.env.STUDIO_GITHUB_REDIRECT_URL,
    moderators: process.env.STUDIO_GITHUB_MODERATORS,
  },
  gitlab: {
    applicationId: process.env.STUDIO_GITLAB_APPLICATION_ID,
    applicationSecret: process.env.STUDIO_GITLAB_APPLICATION_SECRET,
    redirectUrl: process.env.STUDIO_GITLAB_REDIRECT_URL,
    moderators: process.env.STUDIO_GITLAB_MODERATORS,
  },
  google: {
    clientId: process.env.STUDIO_GOOGLE_CLIENT_ID,
    clientSecret: process.env.STUDIO_GOOGLE_CLIENT_SECRET,
    redirectUrl: process.env.STUDIO_GOOGLE_REDIRECT_URL,
    moderators: process.env.STUDIO_GOOGLE_MODERATORS,
  },
  sso: {
    serverUrl: process.env.STUDIO_SSO_URL,
    clientId: process.env.STUDIO_SSO_CLIENT_ID,
    clientSecret: process.env.STUDIO_SSO_CLIENT_SECRET,
    redirectUrl: process.env.STUDIO_SSO_REDIRECT_URL,
  },
  git: {
    githubToken: process.env.STUDIO_GITHUB_TOKEN,
    gitlabToken: process.env.STUDIO_GITLAB_TOKEN,
  },
  ai: {
    apiKey: process.env.AI_GATEWAY_API_KEY,
  },
  s3PublicUrl: process.env.S3_PUBLIC_URL,
}

// Detect repository from CI / platform env vars once at server startup.
// VERCEL_GIT_* and Netlify vars are available at runtime; GitHub Actions / GitLab CI
// vars are typically build-time only — use explicit nuxt.config or NUXT_PUBLIC_STUDIO_REPOSITORY_*
// for those deployments.
const ciRepository = detectRepositoryFromCI()

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  if (!config.studio) return

  // Auth credentials
  if (config.studio.auth?.github) {
    config.studio.auth.github = mergeConfig(config.studio.auth.github, legacyEnvDefaults.github)
  }
  if (config.studio.auth?.gitlab) {
    config.studio.auth.gitlab = mergeConfig(config.studio.auth.gitlab, legacyEnvDefaults.gitlab)
  }
  if (config.studio.auth?.google) {
    config.studio.auth.google = mergeConfig(config.studio.auth.google, legacyEnvDefaults.google)
  }
  if (config.studio.auth?.sso) {
    config.studio.auth.sso = mergeConfig(config.studio.auth.sso, legacyEnvDefaults.sso)
  }
  if (config.studio.git) {
    config.studio.git = mergeConfig(config.studio.git, legacyEnvDefaults.git)
  }

  // AI API key — fills empty slot so NUXT_STUDIO_AI_API_KEY / nuxt.config take precedence
  if (config.studio.ai) {
    config.studio.ai = mergeConfig(config.studio.ai, legacyEnvDefaults.ai)
  }

  // Reflect actual runtime AI availability in the public config so the editor UI is accurate
  if (config.public?.studio?.ai) {
    config.public.studio.ai.enabled = Boolean(config.studio.ai?.apiKey)
  }

  // S3 media public URL
  if (config.public?.studio?.media && legacyEnvDefaults.s3PublicUrl) {
    config.public.studio.media = mergeConfig(config.public.studio.media, { publicUrl: legacyEnvDefaults.s3PublicUrl })
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
