import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import type { Repository, UseStudioHost } from 'nuxt-studio/app'
import { defineStudioActivationPlugin } from '../utils/activation'

export default defineNuxtPlugin(() => {
  // Don't await this to avoid blocking the main thread
  defineStudioActivationPlugin(async (user) => {
    const config = useRuntimeConfig()
    // Initialize host
    const host = await import(config.public.studio.dev ? '../host.dev' : '../host').then(m => m.useStudioHost)
    const hostInstance = host(user, config.public.studio.repository as Repository);
    (window as unknown as { useStudioHost: UseStudioHost }).useStudioHost = () => hostInstance

    await import('nuxt-studio/app')
    document.body.appendChild(document.createElement('nuxt-studio'))
  })
})
