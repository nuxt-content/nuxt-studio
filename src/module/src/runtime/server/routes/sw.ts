import { serviceWorker } from 'nuxt-studio/app/service-worker'
import { eventHandler, setHeader } from 'h3'

export default eventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/javascript')
  return serviceWorker()
})