import { getAppManifest, useState, useRuntimeConfig, useCookie } from '#imports'
import type { StudioUser } from 'nuxt-studio/app'

export async function defineStudioActivationPlugin(onStudioActivation: (user: StudioUser) => Promise<void>) {
  const user = useState<StudioUser | null>('studio-session', () => null)
  const config = useRuntimeConfig().public.studio
  const cookie = useCookie('studio-session-check')

  if (config.dev) {
    return await onStudioActivation({
      provider: 'github',
      email: 'dev@nuxt.com',
      name: 'Dev',
      accessToken: '',
      providerId: '',
      avatar: '',
    })
  }

  user.value = String(cookie.value) === 'true'
    ? await $fetch<{ user: StudioUser }>('/__nuxt_studio/auth/session').then(session => session?.user ?? null)
    : null

  let mounted = false
  if (user.value?.email) {
    // Disable prerendering for Studio
    const manifest = await getAppManifest()
    manifest.prerendered = []

    await onStudioActivation(user.value!)
    mounted = true
  }
  else if (mounted) {
    window.location.reload()
  }
  else if (config.shortcut) {
    const macOS = /Macintosh;/.test(navigator.userAgent)

    const keySplit = config.shortcut.toLowerCase().split('_').map(k => k)
    const key = keySplit.filter(k => !['meta', 'command', 'ctrl', 'shift', 'alt', 'option'].includes(k)).join('_')

    let metaKey = keySplit.includes('meta') || keySplit.includes('command')
    let ctrlKey = keySplit.includes('ctrl')
    const shiftKey = keySplit.includes('shift')
    const altKey = keySplit.includes('alt') || keySplit.includes('option')

    // Convert Meta to Ctrl for non-MacOS
    if (!macOS && metaKey && !ctrlKey) {
      metaKey = false
      ctrlKey = true
    }

    const shiftableKeys = ['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'tab', 'escape', 'enter', 'backspace']

    document.addEventListener('keydown', (e) => {
      if (!e.key) {
        return
      }

      if (e.key.toLowerCase() !== key) {
        return
      }
      if (e.metaKey !== metaKey) {
        return
      }
      if (e.ctrlKey !== ctrlKey) {
        return
      }
      if (e.altKey !== altKey) {
        return
      }

      // Shift modifier is checked for alphabet keys, shiftable keys, explicit shift shortcuts,
      // or when shift is pressed alongside meta/ctrl (where shift doesn't transform the key value).
      // Without meta/ctrl, shift changes the key itself (e.g. / -> ?) so the check is skipped.
      const alphabetKey = /^[a-z]$/i.test(e.key)
      const shiftableKey = shiftableKeys.includes(e.key.toLowerCase())
      if ((alphabetKey || shiftableKey || shiftKey || (e.shiftKey && (e.metaKey || e.ctrlKey))) && e.shiftKey !== shiftKey) {
        return
      }

      e.preventDefault()
      setTimeout(() => {
        window.location.href = config.route + '?redirect=' + encodeURIComponent(window.location.pathname)
      })
    })
  }
}
