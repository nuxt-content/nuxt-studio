import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { checkStudioActivation } from '../utils/activation'

export default defineNuxtPlugin(async () => {
  checkStudioActivation(async () => {
    const config = useRuntimeConfig()
    console.log(`
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗███╗   ██╗████████╗    ██████╗ ███████╗██╗   ██╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝    ██╔══██╗██╔════╝██║   ██║
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║   ██║       ██║  ██║█████╗  ██║   ██║
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║   ██║       ██║  ██║██╔══╝  ╚██╗ ██╔╝
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██║ ╚████║   ██║       ██████╔╝███████╗ ╚████╔╝ 
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═════╝ ╚══════╝  ╚═══╝  
                                                                                            
        `)

    window.useStudioHost = await import('../utils/host').then(m => m.useStudioHost)

    const el = document.createElement('script')
    el.src = `${config.public.studioDevServer}/src/index.ts`
    el.type = 'module'
    document.body.appendChild(el)

    const wp = document.createElement('nuxt-studio')
    document.body.appendChild(wp)
  })
})
