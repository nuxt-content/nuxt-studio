import { useRuntimeConfig } from '#imports'
import { defineNitroPlugin } from 'nitropack/runtime'
import { createHash } from 'node:crypto'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig() as Record<string, any>
  const s = config.studio
  if (!s) return

  function fill(obj: Record<string, any>, key: string, value: string | undefined) {
    if (!obj[key] && value) obj[key] = value
  }

  // GitHub auth
  if (s.auth?.github) {
    fill(s.auth.github, 'clientId', process.env.STUDIO_GITHUB_CLIENT_ID)
    fill(s.auth.github, 'clientSecret', process.env.STUDIO_GITHUB_CLIENT_SECRET)
    fill(s.auth.github, 'instanceUrl', process.env.STUDIO_GITHUB_INSTANCE_URL)
    fill(s.auth.github, 'redirectUrl', process.env.STUDIO_GITHUB_REDIRECT_URL)
    fill(s.auth.github, 'moderators', process.env.STUDIO_GITHUB_MODERATORS)
  }

  // GitLab auth
  if (s.auth?.gitlab) {
    fill(s.auth.gitlab, 'applicationId', process.env.STUDIO_GITLAB_APPLICATION_ID)
    fill(s.auth.gitlab, 'applicationSecret', process.env.STUDIO_GITLAB_APPLICATION_SECRET)
    fill(s.auth.gitlab, 'instanceUrl', process.env.STUDIO_GITLAB_INSTANCE_URL)
    fill(s.auth.gitlab, 'redirectUrl', process.env.STUDIO_GITLAB_REDIRECT_URL)
    fill(s.auth.gitlab, 'moderators', process.env.STUDIO_GITLAB_MODERATORS)
  }

  // Google auth
  if (s.auth?.google) {
    fill(s.auth.google, 'clientId', process.env.STUDIO_GOOGLE_CLIENT_ID)
    fill(s.auth.google, 'clientSecret', process.env.STUDIO_GOOGLE_CLIENT_SECRET)
    fill(s.auth.google, 'redirectUrl', process.env.STUDIO_GOOGLE_REDIRECT_URL)
    fill(s.auth.google, 'moderators', process.env.STUDIO_GOOGLE_MODERATORS)
  }

  // SSO auth
  if (s.auth?.sso) {
    fill(s.auth.sso, 'serverUrl', process.env.STUDIO_SSO_URL)
    fill(s.auth.sso, 'clientId', process.env.STUDIO_SSO_CLIENT_ID)
    fill(s.auth.sso, 'clientSecret', process.env.STUDIO_SSO_CLIENT_SECRET)
    fill(s.auth.sso, 'redirectUrl', process.env.STUDIO_SSO_REDIRECT_URL)
  }

  // Git tokens
  if (s.git) {
    fill(s.git, 'githubToken', process.env.STUDIO_GITHUB_TOKEN)
    fill(s.git, 'gitlabToken', process.env.STUDIO_GITLAB_TOKEN)
  }

  // AI
  if (s.ai) {
    fill(s.ai, 'apiKey', process.env.AI_GATEWAY_API_KEY)
  }

  // Media
  if (s.media) {
    fill(s.media, 'publicUrl', process.env.S3_PUBLIC_URL)
  }

  // Recompute session secret from the now-populated credential values
  const credValues = [
    s.auth.github?.clientId,
    s.auth.github?.clientSecret,
    s.auth.gitlab?.applicationId,
    s.auth.gitlab?.applicationSecret,
    s.auth.google?.clientId,
    s.auth.google?.clientSecret,
    s.auth.sso?.serverUrl,
    s.auth.sso?.clientId,
    s.auth.sso?.clientSecret,
    s.git?.githubToken,
    s.git?.gitlabToken,
  ]
  if (credValues.some(Boolean)) {
    s.auth.sessionSecret = createHash('md5').update(credValues.join('')).digest('hex')
  }

  // Expose AI enabled flag to the client (public runtimeConfig is serialised per-request)
  if (config.public?.studio?.ai !== undefined) {
    config.public.studio.ai.enabled = !!s.ai?.apiKey
  }
})
