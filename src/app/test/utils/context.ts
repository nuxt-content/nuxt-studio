import { StudioFeature, type StudioHost } from '../../src/types'
import { createMockHost, clearMockHost } from '../mocks/host'
import { createMockGit } from '../mocks/git'
import { createMockStorage } from '../mocks/composables'
import type { useGitProvider } from '../../src/composables/useGitProvider'
import { vi } from 'vitest'

export const mockStorageDraft = createMockStorage()
export const mockHost = createMockHost()
export const mockGit = createMockGit()

export const routeState = { name: 'content' }

vi.mock('unstorage/drivers/indexedb', () => ({
  default: () => ({
    async getItem(key: string) {
      return mockStorageDraft.get(key) || null
    },
    async setItem(key: string, value: string) {
      mockStorageDraft.set(key, value)
    },
    async removeItem(key: string) {
      mockStorageDraft.delete(key)
    },
    async getKeys() {
      return Array.from(mockStorageDraft.keys())
    },
  }),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    get name() {
      return routeState.name
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

export const cleanAndSetupContext = async (mockedHost: StudioHost, mockedGit: ReturnType<typeof useGitProvider>) => {
  // Reset mocks
  vi.clearAllMocks()
  mockStorageDraft.clear()
  clearMockHost()

  // Reset all composables to kill previous instances
  vi.resetModules()

  // Re-import composables to get fresh instances after resetModules
  const { useDraftDocuments } = await import('../../src/composables/useDraftDocuments')
  const { useDraftMedias } = await import('../../src/composables/useDraftMedias')
  const { useTree } = await import('../../src/composables/useTree')
  const { useContext } = await import('../../src/composables/useContext')

  // Initialize document tree
  const draftDocuments = useDraftDocuments(mockedHost, mockedGit)
  const documentTree = useTree(StudioFeature.Content, mockedHost, draftDocuments)

  // Initialize media tree
  const draftMedias = useDraftMedias(mockedHost, mockedGit)
  const mediaTree = useTree(StudioFeature.Media, mockedHost, draftMedias)

  // Initialize context
  return useContext(mockedHost, mockedGit, documentTree, mediaTree)
}
