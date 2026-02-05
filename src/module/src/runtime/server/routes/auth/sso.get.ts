import { eventHandler, createError, getQuery, sendRedirect, getRequestURL, getCookie, deleteCookie, type H3Event } from 'h3'
import { withQuery } from 'ufo'
import { defu } from 'defu'
import { useRuntimeConfig } from '#imports'
import { generateOAuthState, requestAccessToken, validateOAuthState } from '../../../utils/auth'
import { setInternalStudioUserSession } from '../../utils/session'

export interface SSOUser {
  sub: string
  name: string
  email: string
  picture?: string
  github_token?: string
  git_provider?: 'github' | 'gitlab'
}

export interface SSOServerConfig {
  /**
   * SSO Server URL (e.g., 'https://auth.example.com')
   * @default process.env.STUDIO_SSO_URL
   */
  serverUrl?: string
  /**
   * SSO Client ID
   * @default process.env.STUDIO_SSO_CLIENT_ID
   */
  clientId?: string
  /**
   * SSO Client Secret
   * @default process.env.STUDIO_SSO_CLIENT_SECRET
   */
  clientSecret?: string
  /**
   * Redirect URL to allow overriding for situations like prod failing to determine public hostname
   * @default is ${hostname}/__nuxt_studio/auth/sso
   */
  redirectURL?: string
}

export default eventHandler(async (event: H3Event) => {
  /**
   * SSO provider validation
   */
  const studioConfig = useRuntimeConfig(event).studio
  const config = defu(studioConfig?.auth?.sso, {
    serverUrl: process.env.STUDIO_SSO_URL,
    clientId: process.env.STUDIO_SSO_CLIENT_ID,
    clientSecret: process.env.STUDIO_SSO_CLIENT_SECRET,
    redirectURL: process.env.STUDIO_SSO_REDIRECT_URL,
  }) as SSOServerConfig

  const query = getQuery<{ code?: string, error?: string, error_description?: string, state?: string }>(event)

  if (query.error) {
    throw createError({
      statusCode: 401,
      message: `SSO login failed: ${query.error_description || query.error || 'Unknown error'}`,
      data: query,
    })
  }

  if (!config.serverUrl || !config.clientId || !config.clientSecret) {
    throw createError({
      statusCode: 500,
      message: 'Missing SSO server URL, client ID, or client secret. Set STUDIO_SSO_URL, STUDIO_SSO_CLIENT_ID, and STUDIO_SSO_CLIENT_SECRET environment variables.',
      data: config,
    })
  }

  // Remove trailing slash from server URL
  const serverUrl = config.serverUrl.replace(/\/$/, '')

  const requestURL = getRequestURL(event)
  config.redirectURL = config.redirectURL || `${requestURL.protocol}//${requestURL.host}${requestURL.pathname}`

  if (!query.code) {
    // Initial authorization request (generate and store state)
    const state = await generateOAuthState(event)

    // Redirect to SSO server authorization page
    // Note: No scope needed - SSO server always returns all user info + GitHub token
    return sendRedirect(
      event,
      withQuery(`${serverUrl}/oauth/authorize`, {
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: config.redirectURL,
        state,
      }),
    )
  }

  // Validate OAuth state and delete the cookie or throw an error
  validateOAuthState(event, query.state as string)

  const provider = studioConfig?.repository.provider

  // Exchange authorization code for tokens
  const token = await requestAccessToken(`${serverUrl}/oauth/token`, {
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      grant_type: 'authorization_code',
      code: query.code as string,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectURL,
    },
  })

  if (token.error || !token.access_token) {
    throw createError({
      statusCode: 500,
      message: `Failed to get access token: ${token.error_description || token.error || 'Unknown error'}`,
      data: token,
    })
  }

  // Fetch user info from SSO server
  const user = await $fetch<SSOUser>(
    `${serverUrl}/oauth/userinfo`,
    {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    },
  )

  if (!user.email) {
    throw createError({
      statusCode: 500,
      message: 'Could not get user email from SSO server',
      data: user,
    })
  }

  /**
   * Git provider token resolution
   * Priority: SSO-provided token > Environment variable
   */
  let repositoryToken: string | undefined

  // Try to use the GitHub token from SSO if available (users who logged in with GitHub on SSO server)
  if (provider === 'github' && user.github_token) {
    repositoryToken = user.github_token
  }
  // Fall back to environment variable
  else if (provider === 'github') {
    repositoryToken = process.env.STUDIO_GITHUB_TOKEN
  }
  else if (provider === 'gitlab') {
    repositoryToken = process.env.STUDIO_GITLAB_TOKEN
  }

  // Validate that we have a token
  if (provider === 'github' && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: 'No GitHub token available. Make sure to login with GitHub on the SSO server.',
    })
  }
  if (provider === 'gitlab' && !repositoryToken) {
    throw createError({
      statusCode: 500,
      message: '`STUDIO_GITLAB_TOKEN` is not set. SSO authenticated users cannot push changes to the repository without a valid GitLab token.',
    })
  }

  await setInternalStudioUserSession(event, {
    providerId: user.sub,
    accessToken: repositoryToken as string,
    name: user.name,
    avatar: user.picture,
    email: user.email,
    provider: user.git_provider || 'github', // Use the git provider from SSO, default to github
  })

  const redirect = decodeURIComponent(getCookie(event, 'studio-redirect') || '')
  deleteCookie(event, 'studio-redirect')

  // Make sure the redirect is a valid relative path (avoid also // which is not a valid URL)
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return sendRedirect(event, redirect)
  }

  return sendRedirect(event, '/')
})
