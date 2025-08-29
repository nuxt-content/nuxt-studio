import type { Ref } from 'vue'
import { watch } from 'vue'
import { useUserSession, getAppManifest } from '#imports'

interface User {
  contentUser: any
  name: string
  email: string
  avatar: string
  githubId: string
  githubToken: string
  provider: 'google' | 'github'
}
export async function checkPreviewActivation(onPreviewActivation: (user: User) => Promise<void>) {
  const user = useUserSession().user as unknown as Ref<User | null>

  let mounted = false
  watch(user, async (newUser) => {
    if (newUser?.contentUser) {
      // Disable prerendering for preview
      const manifest = await getAppManifest()
      manifest.prerendered = []

      await onPreviewActivation(newUser)
      mounted = true
    }
    else if (mounted) {
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    }
  }, { immediate: true })
}
