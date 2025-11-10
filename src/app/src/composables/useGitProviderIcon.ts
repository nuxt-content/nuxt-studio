import { computed } from 'vue'
import { useStudio } from './useStudio'
import type { GitProviderType } from '../types'

export function useGitProviderIcon() {
  const { host } = useStudio()

  const provider = computed<GitProviderType>(() => host.repository.provider)

  const icon = computed(() => {
    switch (provider.value) {
      case 'github':
        return 'i-simple-icons:github'
      case 'gitlab':
        return 'i-simple-icons:gitlab'
      default:
        return 'i-simple-icons:git'
    }
  })

  const providerName = computed(() => {
    switch (provider.value) {
      case 'github':
        return 'GitHub'
      case 'gitlab':
        return 'GitLab'
      default:
        return 'Git'
    }
  })

  return {
    provider,
    icon,
    providerName,
  }
}
