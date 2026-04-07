import type { DatabaseItem, StudioHost } from '../../src/types'
import type { MediaItem } from '../../src/types/media'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../src/utils/media'
import { vi } from 'vitest'
import { joinURL } from 'ufo'
import { createMockDocument } from './document'
import { createMockMedia } from './media'

const documentDb = new Map<string, DatabaseItem>()
const mediaDb = new Map<string, MediaItem>()
const reservedDocumentKeys = ['id', 'fsPath', 'path', 'stem', 'extension', 'body', 'meta', 'rawbody', '__hash__'] as const

// Helper to convert fsPath to id (simulates module's internal mapping)
export const fsPathToId = (fsPath: string, type: 'document' | 'media') => {
  if (type === 'media') {
    return joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath)
  }

  return joinURL('docs', fsPath)
}

// Helper to convert id back to fsPath (simulates module's internal mapping)
export const idToFsPath = (id: string) => {
  return id.split('/').slice(1).join('/')
}

function getBodyContent(document?: DatabaseItem) {
  const body = document?.body as { value?: string[] } | undefined
  return Array.isArray(body?.value) ? body.value.join('\n') : ''
}

function pickReservedKeys(document: DatabaseItem) {
  return Object.fromEntries(
    reservedDocumentKeys
      .filter(key => key in document)
      .map(key => [key, document[key as keyof DatabaseItem | '__hash__']]),
  ) as DatabaseItem
}

function cleanDocumentData(document: DatabaseItem) {
  return Object.fromEntries(
    Object.entries(document).filter(([key]) => !reservedDocumentKeys.includes(key as typeof reservedDocumentKeys[number])),
  ) as DatabaseItem
}

async function generateDocumentFromContent(id: string, content: string) {
  return createMockDocument(id, {
    fsPath: idToFsPath(id),
    body: {
      type: 'minimark',
      value: [content?.trim() || 'Test content'],
    },
  })
}

export const createMockHost = (): StudioHost => ({
  document: {
    db: {
      get: vi.fn().mockImplementation(async (fsPath: string) => {
        const id = fsPathToId(fsPath, 'document')
        if (documentDb.has(id)) {
          return documentDb.get(id)
        }

        const document = createMockDocument(id)
        documentDb.set(id, document)
        return document
      }),
      create: vi.fn().mockImplementation(async (fsPath: string, content: string) => {
        const id = fsPathToId(fsPath, 'document')
        const document = createMockDocument(id, {
          body: { type: 'minimark', value: [content?.trim() || 'Test content'] },
          fsPath,
        })
        documentDb.set(id, document)
        return document
      }),
      upsert: vi.fn().mockImplementation(async (fsPath: string, document: DatabaseItem) => {
        documentDb.set(fsPathToId(fsPath, 'document'), document)
      }),
      delete: vi.fn().mockImplementation(async (fsPath: string) => {
        documentDb.delete(fsPathToId(fsPath, 'document'))
      }),
      list: vi.fn().mockImplementation(async () => Array.from(documentDb.values())),
    },
    utils: {
      areEqual: vi.fn().mockImplementation((document1: DatabaseItem, document2: DatabaseItem) => {
        return JSON.stringify(document1) === JSON.stringify(document2)
      }),
      isMatchingContent: vi.fn().mockImplementation(async (content: string, document: DatabaseItem) => {
        return getBodyContent(document).trim() === content.trim()
      }),
      pickReservedKeys: vi.fn().mockImplementation((document: DatabaseItem) => {
        return pickReservedKeys(document)
      }),
      cleanDataKeys: vi.fn().mockImplementation((document: DatabaseItem) => {
        return cleanDocumentData(document)
      }),
      detectActives: vi.fn().mockReturnValue([]),
    },
    generate: {
      documentFromContent: vi.fn().mockImplementation(async (id: string, content: string) => {
        return generateDocumentFromContent(id, content)
      }),
      contentFromDocument: vi.fn().mockImplementation(async (document: DatabaseItem) => {
        return getBodyContent(document)
      }),
    },
  },
  media: {
    get: vi.fn().mockImplementation(async (fsPath: string) => {
      const id = fsPathToId(fsPath, 'media')
      if (mediaDb.has(id)) {
        return mediaDb.get(id)
      }

      const media = createMockMedia(id)
      mediaDb.set(id, media)
      return media
    }),
    create: vi.fn().mockImplementation(async (fsPath: string, _routePath: string, _content: string) => {
      const id = fsPathToId(fsPath, 'media')
      const media = createMockMedia(id)
      mediaDb.set(id, media)
      return media
    }),
    upsert: vi.fn().mockImplementation(async (fsPath: string, media: MediaItem) => {
      mediaDb.set(fsPathToId(fsPath, 'media'), media)
    }),
    delete: vi.fn().mockImplementation(async (fsPath: string) => {
      mediaDb.delete(fsPathToId(fsPath, 'media'))
    }),
    list: vi.fn().mockImplementation(async () => Array.from(mediaDb.values())),
  },
  app: {
    requestRerender: vi.fn(),
    navigateTo: vi.fn(),
    getManifestId: vi.fn().mockResolvedValue('test-manifest-id'),
  },
  meta: {
    dev: false,
    components: vi.fn().mockReturnValue([]),
  },
  on: {
    routeChange: vi.fn(),
    mounted: vi.fn(),
    beforeUnload: vi.fn(),
    colorModeChange: vi.fn(),
    manifestUpdate: vi.fn(),
    documentUpdate: vi.fn(),
    mediaUpdate: vi.fn(),
  },
  ui: {
    colorMode: 'light',
    activateStudio: vi.fn(),
    deactivateStudio: vi.fn(),
    expandSidebar: vi.fn(),
    collapseSidebar: vi.fn(),
    updateStyles: vi.fn(),
  },
  user: {
    get: vi.fn().mockReturnValue({ name: 'Test User', email: 'test@example.com' }),
  },
  repository: {
    provider: 'github',
    owner: 'test-owner',
    name: 'test-repo',
    branch: 'main',
  },
  collection: {
    getByFsPath: vi.fn().mockReturnValue(undefined),
  },
} as never)

export const clearMockHost = () => {
  documentDb.clear()
  mediaDb.clear()
}
