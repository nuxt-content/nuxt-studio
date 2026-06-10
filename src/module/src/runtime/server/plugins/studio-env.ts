import { useRuntimeConfig } from '#imports'
import { defineNitroPlugin } from 'nitropack/runtime'
import { createHash } from 'node:crypto'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const s = config.studio
  if (!s) return

  function fill(obj: Record<string, string>, key: string, value: string | undefined) {
    if (!obj[key] && value) obj[key] = value
  }

  // GitHub auth
  if (s.auth?.github) {
    const gh = s.auth.github as Record<string, string>
    fill(gh, 'clientId', process.env.STUDIO_GITHUB_CLIENT_ID)
    fill(gh, 'clientSecret', process.env.STUDIO_GITHUB_CLIENT_SECRET)
    fill(gh, 'instanceUrl', process.env.STUDIO_GITHUB_INSTANCE_URL)
    fill(gh, 'redirectUrl', process.env.STUDIO_GITHUB_REDIRECT_URL)
    fill(gh, 'moderators', process.env.STUDIO_GITHUB_MODERATORS)
  }

  // GitLab auth
  if (s.auth?.gitlab) {
    const gl = s.auth.gitlab as Record<string, string>
    fill(gl, 'applicationId', process.env.STUDIO_GITLAB_APPLICATION_ID)
    fill(gl, 'applicationSecret', process.env.STUDIO_GITLAB_APPLICATION_SECRET)
    fill(gl, 'instanceUrl', process.env.STUDIO_GITLAB_INSTANCE_URL)
    fill(gl, 'redirectUrl', process.env.STUDIO_GITLAB_REDIRECT_URL)
    fill(gl, 'moderators', process.env.STUDIO_GITLAB_MODERATORS)
  }

  // Google auth
  if (s.auth?.google) {
    const gg = s.auth.google as Record<string, string>
    fill(gg, 'clientId', process.env.STUDIO_GOOGLE_CLIENT_ID)
    fill(gg, 'clientSecret', process.env.STUDIO_GOOGLE_CLIENT_SECRET)
    fill(gg, 'redirectUrl', process.env.STUDIO_GOOGLE_REDIRECT_URL)
    fill(gg, 'moderators', process.env.STUDIO_GOOGLE_MODERATORS)
  }

  // SSO auth
  if (s.auth?.sso) {
    const sso = s.auth.sso as Record<string, string>
    fill(sso, 'serverUrl', process.env.STUDIO_SSO_URL)
    fill(sso, 'clientId', process.env.STUDIO_SSO_CLIENT_ID)
    fill(sso, 'clientSecret', process.env.STUDIO_SSO_CLIENT_SECRET)
    fill(sso, 'redirectUrl', process.env.STUDIO_SSO_REDIRECT_URL)
  }

  // Git tokens
  if (s.git) {
    const git = s.git as unknown as Record<string, string>
    fill(git, 'githubToken', process.env.STUDIO_GITHUB_TOKEN)
    fill(git, 'gitlabToken', process.env.STUDIO_GITLAB_TOKEN)
  }

  // AI
  if (s.ai) {
    const ai = s.ai as unknown as Record<string, string>
    fill(ai, 'apiKey', process.env.AI_GATEWAY_API_KEY)
  }

  // Media
  if (s.media) {
    const media = s.media as unknown as Record<string, string>
    fill(media, 'publicUrl', process.env.S3_PUBLIC_URL)
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
  const publicStudio = config.public?.studio
  if (publicStudio?.ai !== undefined) {
    (publicStudio.ai as Record<string, unknown>).enabled = !!s.ai?.apiKey
  }
})
