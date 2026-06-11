import { useRuntimeConfig } from '#imports'
import { defineNitroPlugin } from 'nitropack/runtime'
import { createHash } from 'node:crypto'
import { defu } from 'defu'

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  const studio = config.studio
  if (!studio) return

  // GitHub auth
  if (studio.auth?.github) {
    studio.auth.github = defu(studio.auth.github, {
      clientId: process.env.STUDIO_GITHUB_CLIENT_ID,
      clientSecret: process.env.STUDIO_GITHUB_CLIENT_SECRET,
      instanceUrl: process.env.STUDIO_GITHUB_INSTANCE_URL,
      redirectUrl: process.env.STUDIO_GITHUB_REDIRECT_URL,
      moderators: process.env.STUDIO_GITHUB_MODERATORS,
    })
  }

  // GitLab auth
  if (studio.auth?.gitlab) {
    studio.auth.gitlab = defu(studio.auth.gitlab, {
      applicationId: process.env.STUDIO_GITLAB_APPLICATION_ID,
      applicationSecret: process.env.STUDIO_GITLAB_APPLICATION_SECRET,
      instanceUrl: process.env.STUDIO_GITLAB_INSTANCE_URL,
      redirectUrl: process.env.STUDIO_GITLAB_REDIRECT_URL,
      moderators: process.env.STUDIO_GITLAB_MODERATORS,
    })
  }

  // Google auth
  if (studio.auth?.google) {
    studio.auth.google = defu(studio.auth.google, {
      clientId: process.env.STUDIO_GOOGLE_CLIENT_ID,
      clientSecret: process.env.STUDIO_GOOGLE_CLIENT_SECRET,
      redirectUrl: process.env.STUDIO_GOOGLE_REDIRECT_URL,
      moderators: process.env.STUDIO_GOOGLE_MODERATORS,
    })
  }

  // SSO auth
  if (studio.auth?.sso) {
    studio.auth.sso = defu(studio.auth.sso, {
      serverUrl: process.env.STUDIO_SSO_URL,
      clientId: process.env.STUDIO_SSO_CLIENT_ID,
      clientSecret: process.env.STUDIO_SSO_CLIENT_SECRET,
      redirectUrl: process.env.STUDIO_SSO_REDIRECT_URL,
    })
  }

  // Git tokens
  if (studio.git) {
    studio.git = defu(studio.git, {
      githubToken: process.env.STUDIO_GITHUB_TOKEN,
      gitlabToken: process.env.STUDIO_GITLAB_TOKEN,
    })
  }

  // Media
  if (studio.media) {
    studio.media = defu(studio.media, {
      publicUrl: process.env.S3_PUBLIC_URL,
    })
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
