import type { H3Event } from 'h3'

/**
 * Verify that the request comes from an authenticated Studio session.
 * Uses the same pattern as src/module/src/runtime/server/routes/meta.ts
 *
 * In dev mode, allow all requests.
 * In production, check for valid Studio session using useSession().
 */
export async function requireStudioAuth(event: H3Event): Promise<void> {
  // Skip auth in dev mode
  if (import.meta.dev) {
    return
  }

  const config = useRuntimeConfig(event)

  const session = await useSession(event, {
    name: 'studio-session',
    password: config.studio?.auth?.sessionSecret,
    cookie: {
      secure: getRequestProtocol(event) === 'https',
      path: '/',
    },
  })

  // Return 404 to hide endpoint existence (same pattern as meta.ts)
  if (!session?.data?.user) {
    throw createError({
      statusCode: 404,
      message: 'Not found',
    })
  }
}
