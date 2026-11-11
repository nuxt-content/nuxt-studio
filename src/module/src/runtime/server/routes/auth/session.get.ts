import { eventHandler, useSession, deleteCookie, getRequestProtocol, setResponseHeaders } from 'h3'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  // The response is the user's own session (with their git token): make sure
  // no proxy or CDN between the server and the browser stores it for others
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'Vary': 'Cookie',
  })

  const session = await useSession(event, {
    name: 'studio-session',
    password: useRuntimeConfig(event).studio?.auth?.sessionSecret,
    cookie: {
      // Use secure cookies over HTTPS, required for locally testing purposes
      secure: getRequestProtocol(event) === 'https',
      path: '/',
    },
  })

  if (!session.data || Object.keys(session.data).length === 0) {
    // Delete the cookie to indicate that the session is inactive
    deleteCookie(event, 'studio-session-check', { path: '/' })
  }

  return {
    ...session.data,
    id: session.id!,
  }
})
