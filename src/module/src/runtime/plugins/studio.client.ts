import { defineNuxtPlugin } from '#imports'
import { defineStudioActivationPlugin } from '../utils/activation'

export default defineNuxtPlugin(async () => {
  await defineStudioActivationPlugin(async () => {
    await import('nuxt-studio/app')
    document.body.appendChild(document.createElement('nuxt-studio'))
  })
})
