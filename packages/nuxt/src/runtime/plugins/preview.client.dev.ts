import { defineNuxtPlugin, useRuntimeConfig } from '#imports'
import { checkPreviewActivation } from '../utils/preview'

export default defineNuxtPlugin(async () => {
  checkPreviewActivation(async () => {
    const config = useRuntimeConfig()
    if (typeof window !== 'undefined') {
      console.log(`
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗███╗   ██╗████████╗    ██████╗ ███████╗██╗   ██╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝████╗  ██║╚══██╔══╝    ██╔══██╗██╔════╝██║   ██║
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗  ██╔██╗ ██║   ██║       ██║  ██║█████╗  ██║   ██║
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝  ██║╚██╗██║   ██║       ██║  ██║██╔══╝  ╚██╗ ██╔╝
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██║ ╚████║   ██║       ██████╔╝███████╗ ╚████╔╝ 
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═══╝   ╚═╝       ╚═════╝ ╚══════╝  ╚═══╝  
                                                                                            
        `)
      const el = document.createElement('script')
      el.src = `${config.public.previewDevServer}/src/index.ts`
      el.type = 'module'
      document.body.appendChild(el)

      const wp = document.createElement('preview-app')
      document.body.appendChild(wp)
    }
  })
})
