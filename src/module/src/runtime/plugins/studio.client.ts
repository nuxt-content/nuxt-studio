import { defineNuxtPlugin } from '#imports'
import { checkStudioActivation } from '../utils/activation'

export default defineNuxtPlugin(async () => {
  checkStudioActivation(async () => {
    window.useStudioHost = await import('../utils/host').then(m => m.useStudioHost)

    await import('nuxt-studio/app')
    document.body.appendChild(document.createElement('nuxt-studio'))
  })
})
