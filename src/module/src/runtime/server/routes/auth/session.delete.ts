import { eventHandler, useSession } from 'h3'
import { useRuntimeConfig } from '#imports'

export default eventHandler(async (event) => {
  const session = await useSession(event, {
    name: 'content-studio-session',
    password: useRuntimeConfig(event).studio?.auth?.sessionSecret,
  })

  await session.clear()

  return { loggedOut: true }
})
