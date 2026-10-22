import type {} from 'nuxt/app'
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { consola } from 'consola'
import { defineStudioActivationPlugin } from '../utils/activation'
import type { Repository, UseStudioHost } from 'nuxt-studio/app'

const logger = consola.withTag('Nuxt Studio')

export default defineNuxtPlugin(() => {
  defineStudioActivationPlugin(async (user) => {
    const config = useRuntimeConfig()
    logger.info(`
  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗     ██████╗ ███████╗██╗   ██╗
  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗    ██╔══██╗██╔════╝██║   ██║
  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║█████╗  ██║   ██║
  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║    ██║  ██║██╔══╝  ╚██╗ ██╔╝
  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝    ██████╔╝███████╗ ╚████╔╝
  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝
    `)

    // Initialize host
    const host = await import('../host.dev').then(m => m.useStudioHost)
    const hostInstance = host(user, config.public.studio.repository as Repository);
    (window as unknown as { useStudioHost: UseStudioHost }).useStudioHost = () => hostInstance

    const el = document.createElement('script')
    el.src = `${config.public.studio?.development?.server}/src/main.ts`
    el.type = 'module'
    document.body.appendChild(el)

    const wp = document.createElement('nuxt-studio')
    document.body.appendChild(wp)
  })
})
