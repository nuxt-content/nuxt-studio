import { watch } from 'vue'
import { defineNuxtPlugin, getAppManifest, useUserSession } from '#imports'
import type { NuxtApp } from 'nuxt/app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const { user } = useUserSession()

  let mounted = false
  watch(user, async (newUser) => {
    if (newUser?.contentUser) {
      await mountPreviewUIIfLoggedIn(nuxtApp as NuxtApp, newUser)
      mounted = true
    }
    else if (mounted) {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
  }, { immediate: true })
})

async function mountPreviewUIIfLoggedIn(nuxtApp: NuxtApp, user: any) {
  // Disable prerendering for preview
  const manifest = await getAppManifest()
  manifest.prerendered = []

  // preview/admin login logic
  if (typeof window === 'undefined') {
    nuxtApp.hook('app:mounted', async () => {
      const el = document.createElement('script')
      el.src = 'http://localhost:5174/src/preview-app.webcomponent.ts'
      el.type='module'
      document.body.appendChild(el)

      const wp = document.createElement('preview-app')
      document.body.appendChild(wp)
      // await import('../utils/mountPreviewUI').then(({ mountPreviewUI }) => {
      //   mountPreviewUI()
      // })
    })
  }
  else {
    const el = document.createElement('script')
    el.src = 'http://localhost:5174/src/preview-app.webcomponent.ts'
    el.type='module'
    document.body.appendChild(el)

    const wp = document.createElement('preview-app')
    document.body.appendChild(wp)
    // await import('../utils/mountPreviewUI').then(({ mountPreviewUI }) => {
    //   mountPreviewUI()
    // })
  }
}


