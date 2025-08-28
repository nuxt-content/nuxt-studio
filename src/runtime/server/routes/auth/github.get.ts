import { defineOAuthGitHubEventHandler, setUserSession } from '#imports'
import { sendRedirect } from 'h3'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        contentUser: true,
        githubId: user.id,
        githubToken: tokens.access_token,
        name: user.name,
        avatar: user.avatar_url,
        email: user.email,
        provider: 'github',
      },
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
