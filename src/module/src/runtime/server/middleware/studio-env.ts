import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createHash } from 'node:crypto'
import { defu } from 'defu'
import { detectRepositoryFromCI } from '../utils/repository'

const ciRepository = detectRepositoryFromCI()

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  if (!config.studio) return

  if (config.studio.ai) {
    config.studio.ai.apiKey = config.studio.ai.apiKey || process.env.AI_GATEWAY_API_KEY || ''
  }

  const github = config.studio.auth.github
  if (github) {
    github.clientId = github.clientId || process.env.STUDIO_GITHUB_CLIENT_ID || ''
    github.clientSecret = github.clientSecret || process.env.STUDIO_GITHUB_CLIENT_SECRET || ''
    github.instanceUrl = github.instanceUrl || process.env.STUDIO_GITHUB_INSTANCE_URL || 'https://github.com'
    github.moderators = github.moderators || process.env.STUDIO_GITHUB_MODERATORS || ''
    github.redirectUrl = github.redirectUrl || process.env.STUDIO_GITHUB_REDIRECT_URL || ''
  }

  const gitlab = config.studio.auth.gitlab
  if (gitlab) {
    gitlab.applicationId = gitlab.applicationId || process.env.STUDIO_GITLAB_APPLICATION_ID || ''
    gitlab.applicationSecret = gitlab.applicationSecret || process.env.STUDIO_GITLAB_APPLICATION_SECRET || ''
    gitlab.instanceUrl = gitlab.instanceUrl || process.env.STUDIO_GITLAB_INSTANCE_URL || 'https://gitlab.com'
    gitlab.moderators = gitlab.moderators || process.env.STUDIO_GITLAB_MODERATORS || ''
    gitlab.redirectUrl = gitlab.redirectUrl || process.env.STUDIO_GITLAB_REDIRECT_URL || ''
  }

  const google = config.studio.auth.google
  if (google) {
    google.clientId = google.clientId || process.env.STUDIO_GOOGLE_CLIENT_ID || ''
    google.clientSecret = google.clientSecret || process.env.STUDIO_GOOGLE_CLIENT_SECRET || ''
    google.moderators = google.moderators || process.env.STUDIO_GOOGLE_MODERATORS || ''
    google.redirectUrl = google.redirectUrl || process.env.STUDIO_GOOGLE_REDIRECT_URL || ''
  }

  const sso = config.studio.auth.sso
  if (sso) {
    sso.serverUrl = sso.serverUrl || process.env.STUDIO_SSO_URL || ''
    sso.clientId = sso.clientId || process.env.STUDIO_SSO_CLIENT_ID || ''
    sso.clientSecret = sso.clientSecret || process.env.STUDIO_SSO_CLIENT_SECRET || ''
    sso.redirectUrl = sso.redirectUrl || process.env.STUDIO_SSO_REDIRECT_URL || ''
  }

  if (config.studio.git) {
    config.studio.git.githubToken = config.studio.git.githubToken || process.env.STUDIO_GITHUB_TOKEN || ''
    config.studio.git.gitlabToken = config.studio.git.gitlabToken || process.env.STUDIO_GITLAB_TOKEN || ''
  }

  if (config.studio.media && !config.studio.media.publicUrl) {
    config.studio.media.publicUrl = process.env.S3_PUBLIC_URL || ''
  }

  if (config.public?.studio?.ai) {
    config.public.studio.ai.enabled = Boolean(config.studio.ai?.apiKey)
  }

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
