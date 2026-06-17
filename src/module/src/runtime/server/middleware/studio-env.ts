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

  // ---------------------------------------------------------------------------
  // Backwards compatibility: fill empty runtime-config stubs from legacy STUDIO_*
  // env vars so that deployments that have not yet migrated to NUXT_STUDIO_*
  // names continue to work unchanged.
  //
  // Precedence (highest → lowest):
  //   1. nuxt.config values  (baked into stubs at build time)
  //   2. NUXT_STUDIO_* env vars  (filled by Nuxt's own env-override mechanism)
  //   3. Legacy STUDIO_* / AI_GATEWAY_API_KEY env vars  (filled here)
  //
  // Only fills fields whose current value is empty (""), so options 1 and 2 always win.
  // ---------------------------------------------------------------------------

  // AI
  if (!config.studio.ai.apiKey) {
    config.studio.ai.apiKey = process.env.AI_GATEWAY_API_KEY || ''
  }

  // GitHub OAuth
  const gh = config.studio.auth.github
  if (gh) {
    gh.clientId = gh.clientId || process.env.STUDIO_GITHUB_CLIENT_ID || ''
    gh.clientSecret = gh.clientSecret || process.env.STUDIO_GITHUB_CLIENT_SECRET || ''
    gh.instanceUrl = gh.instanceUrl || process.env.STUDIO_GITHUB_INSTANCE_URL || 'https://github.com'
    gh.moderators = gh.moderators || process.env.STUDIO_GITHUB_MODERATORS || ''
    gh.redirectUrl = gh.redirectUrl || process.env.STUDIO_GITHUB_REDIRECT_URL || ''
  }

  // GitLab OAuth
  const gl = config.studio.auth.gitlab
  if (gl) {
    gl.applicationId = gl.applicationId || process.env.STUDIO_GITLAB_APPLICATION_ID || ''
    gl.applicationSecret = gl.applicationSecret || process.env.STUDIO_GITLAB_APPLICATION_SECRET || ''
    gl.instanceUrl = gl.instanceUrl || process.env.STUDIO_GITLAB_INSTANCE_URL || 'https://gitlab.com'
    gl.moderators = gl.moderators || process.env.STUDIO_GITLAB_MODERATORS || ''
    gl.redirectUrl = gl.redirectUrl || process.env.STUDIO_GITLAB_REDIRECT_URL || ''
  }

  // Google OAuth
  const gg = config.studio.auth.google
  if (gg) {
    gg.clientId = gg.clientId || process.env.STUDIO_GOOGLE_CLIENT_ID || ''
    gg.clientSecret = gg.clientSecret || process.env.STUDIO_GOOGLE_CLIENT_SECRET || ''
    gg.moderators = gg.moderators || process.env.STUDIO_GOOGLE_MODERATORS || ''
    gg.redirectUrl = gg.redirectUrl || process.env.STUDIO_GOOGLE_REDIRECT_URL || ''
  }

  // SSO
  const sso = config.studio.auth.sso
  if (sso) {
    sso.serverUrl = sso.serverUrl || process.env.STUDIO_SSO_URL || ''
    sso.clientId = sso.clientId || process.env.STUDIO_SSO_CLIENT_ID || ''
    sso.clientSecret = sso.clientSecret || process.env.STUDIO_SSO_CLIENT_SECRET || ''
    sso.redirectUrl = sso.redirectUrl || process.env.STUDIO_SSO_REDIRECT_URL || ''
  }

  // Git tokens
  const git = config.studio.git
  if (git) {
    git.githubToken = git.githubToken || process.env.STUDIO_GITHUB_TOKEN || ''
    git.gitlabToken = git.gitlabToken || process.env.STUDIO_GITLAB_TOKEN || ''
  }

  // Media public URL
  const media = config.studio.media
  if (media && !media.publicUrl) {
    media.publicUrl = process.env.S3_PUBLIC_URL || ''
  }

  // ---------------------------------------------------------------------------
  // End of legacy env var backfill
  // ---------------------------------------------------------------------------

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
