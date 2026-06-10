import { useRuntimeConfig } from '#imports'
import { defineNitroPlugin } from 'nitropack/runtime'
import { createHash } from 'node:crypto'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const studio = config.studio
  if (!studio) return

  function fill(obj: Record<string, string>, key: string, value: string | undefined) {
    if (!obj[key] && value) obj[key] = value
  }

  // GitHub auth
  if (studio.auth?.github) {
    const github = studio.auth.github as Record<string, string>
    fill(github, 'clientId', process.env.STUDIO_GITHUB_CLIENT_ID)
    fill(github, 'clientSecret', process.env.STUDIO_GITHUB_CLIENT_SECRET)
    fill(github, 'instanceUrl', process.env.STUDIO_GITHUB_INSTANCE_URL)
    fill(github, 'redirectUrl', process.env.STUDIO_GITHUB_REDIRECT_URL)
    fill(github, 'moderators', process.env.STUDIO_GITHUB_MODERATORS)
  }

  // GitLab auth
  if (studio.auth?.gitlab) {
    const gitlab = studio.auth.gitlab as Record<string, string>
    fill(gitlab, 'applicationId', process.env.STUDIO_GITLAB_APPLICATION_ID)
    fill(gitlab, 'applicationSecret', process.env.STUDIO_GITLAB_APPLICATION_SECRET)
    fill(gitlab, 'instanceUrl', process.env.STUDIO_GITLAB_INSTANCE_URL)
    fill(gitlab, 'redirectUrl', process.env.STUDIO_GITLAB_REDIRECT_URL)
    fill(gitlab, 'moderators', process.env.STUDIO_GITLAB_MODERATORS)
  }

  // Google auth
  if (studio.auth?.google) {
    const google = studio.auth.google as Record<string, string>
    fill(google, 'clientId', process.env.STUDIO_GOOGLE_CLIENT_ID)
    fill(google, 'clientSecret', process.env.STUDIO_GOOGLE_CLIENT_SECRET)
    fill(google, 'redirectUrl', process.env.STUDIO_GOOGLE_REDIRECT_URL)
    fill(google, 'moderators', process.env.STUDIO_GOOGLE_MODERATORS)
  }

  // SSO auth
  if (studio.auth?.sso) {
    const sso = studio.auth.sso as Record<string, string>
    fill(sso, 'serverUrl', process.env.STUDIO_SSO_URL)
    fill(sso, 'clientId', process.env.STUDIO_SSO_CLIENT_ID)
    fill(sso, 'clientSecret', process.env.STUDIO_SSO_CLIENT_SECRET)
    fill(sso, 'redirectUrl', process.env.STUDIO_SSO_REDIRECT_URL)
  }

  // Git tokens
  if (studio.git) {
    const git = studio.git as unknown as Record<string, string>
    fill(git, 'githubToken', process.env.STUDIO_GITHUB_TOKEN)
    fill(git, 'gitlabToken', process.env.STUDIO_GITLAB_TOKEN)
  }

  // Media
  if (studio.media) {
    const media = studio.media as unknown as Record<string, string>
    fill(media, 'publicUrl', process.env.S3_PUBLIC_URL)
  }

  // Recompute session secret from the now-populated credential values
  const credValues = [
    studio.auth.github?.clientId,
    studio.auth.github?.clientSecret,
    studio.auth.gitlab?.applicationId,
    studio.auth.gitlab?.applicationSecret,
    studio.auth.google?.clientId,
    studio.auth.google?.clientSecret,
    studio.auth.sso?.serverUrl,
    studio.auth.sso?.clientId,
    studio.auth.sso?.clientSecret,
    studio.git?.githubToken,
    studio.git?.gitlabToken,
  ]
  if (credValues.some(Boolean)) {
    studio.auth.sessionSecret = createHash('md5').update(credValues.join('')).digest('hex')
  }
})
