import { getAppManifest, useState } from '#imports'
import type { StudioUser } from 'nuxt-studio/app'

export async function defineStudioActivationPlugin(onStudioActivation: () => Promise<void>) {
  const user = useState<StudioUser | null>('content-studio-session', () => null)

  await $fetch<{ user: StudioUser }>('/__nuxt_content/studio/auth/session').then((session) => {
    user.value = session?.user ?? null
  })

  let mounted = false
  if (user.value?.email) {
    // Initialize host
    const host = await import('../host').then(m => m.useStudioHost)
    window.useStudioHost = () => host(user.value)

    // Disable prerendering for Studio
    const manifest = await getAppManifest()
    manifest.prerendered = []

    await onStudioActivation()
    mounted = true
  }
  else if (mounted) {
    window.location.reload()
  }
}
