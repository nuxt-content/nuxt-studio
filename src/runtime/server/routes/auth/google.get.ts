import { defineOAuthGoogleEventHandler, setUserSession } from '#imports'
import { sendRedirect } from 'h3'

export default defineOAuthGoogleEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user }) {
    const moderators = (process.env.NUXT_ADMIN_CONTENT_MODERATORS || '').split(',').map(email => email.trim())
    if (!moderators.includes(user.email)) {
      return sendRedirect(event, '/')
    }

    await setUserSession(event, {
      user: {
        contentUser: true,
        githubId: null,
        githubToken: process.env.NUXT_ADMIN_CONTENT_GITHUB_TOKEN,
        name: user.name,
        avatar: user.picture,
        email: user.email,
        provider: 'google',
      },
    })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
