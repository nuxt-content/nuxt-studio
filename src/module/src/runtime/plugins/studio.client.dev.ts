import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { defineStudioActivationPlugin } from '../utils/activation'
import type { Repository, UseStudioHost } from 'nuxt-studio/app'

export default defineNuxtPlugin(() => {
  defineStudioActivationPlugin(async (user) => {
    const config = useRuntimeConfig()
    console.log(`
  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗     ██████╗ ███████╗██╗   ██╗
  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗    ██╔══██╗██╔════╝██║   ██║
  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║█████╗  ██║   ██║
  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝    ██████╔╝███████╗ ╚████╔╝
  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝
    `)

    // Initialize host
    const host = await import('../host.dev').then(m => m.useStudioHost);
    (window as unknown as { useStudioHost: UseStudioHost }).useStudioHost = () => host(user, config.public.studio.repository as unknown as Repository)

    const el = document.createElement('script')
    el.src = `${config.public.studio?.development?.server}/src/main.ts`
    el.type = 'module'
    document.body.appendChild(el)

    const wp = document.createElement('nuxt-studio')
    document.body.appendChild(wp)
  })
})
