import type { CollectionInfo } from '@nuxt/content'
import type { StudioHost, DatabaseItem } from '../../src/types'
import { ContentFileExtension } from '../../src/types'
import { VIRTUAL_MEDIA_COLLECTION_NAME } from '../../src/utils/media'
import { vi } from 'vitest'
import { createMockDocument } from './document'
import { createMockMedia } from './media'
import { joinURL } from 'ufo'
import type { MediaItem } from '../../src/types/media'
import { getFileExtension } from '../../src/utils/file'
import { jsonToYaml, yamlToJson } from '../../src/utils/data'
import { isDeepEqual } from '../../src/utils/object'

// Helper to convert fsPath to id (simulates module's internal mapping)
export const fsPathToId = (fsPath: string, type: 'document' | 'media') => {
  if (type === 'media') {
    return joinURL(VIRTUAL_MEDIA_COLLECTION_NAME, fsPath)
  }
  // For documents, prefix with a collection name
  return joinURL('docs', fsPath)
}

// Helper to convert id back to fsPath (simulates module's internal mapping)
export const idToFsPath = (id: string) => {
  return id.split('/').slice(1).join('/')
}

const documentDb = new Map<string, DatabaseItem>()
const mediaDb = new Map<string, MediaItem>()
const reservedKeys = ['id', 'fsPath', 'stem', 'extension', '__hash__', 'path', 'body', 'meta', 'rawbody']

function createBaseDocument(id: string, fsPath: string): DatabaseItem {
  const extension = getFileExtension(fsPath)
  const stem = fsPath.split('.').slice(0, -1).join('.')

  return {
    id,
    fsPath,
    path: stem,
    stem,
    extension,
    meta: {},
  } as DatabaseItem
}

function createBodyNode(content: string) {
  return {
    type: 'minimark',
    value: [content.trim() || 'Test content'],
  }
}

function parseMarkdownContent(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const frontmatter = match ? (yamlToJson(match[1] || '') || {}) : {}
  const body = (match ? match[2] : content).trim()

  return {
    ...frontmatter,
    body: createBodyNode(body),
  }
}

function generateDocumentFromTestContent(id: string, fsPath: string, content: string): DatabaseItem {
  const extension = getFileExtension(fsPath)
  const baseDocument = createBaseDocument(id, fsPath)

  switch (extension) {
    case ContentFileExtension.JSON: {
      const parsed = content.trim() ? JSON.parse(content) : {}
      return {
        ...baseDocument,
        ...parsed,
      }
    }
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML: {
      const parsed = yamlToJson(content) || {}
      return {
        ...baseDocument,
        ...parsed,
      }
    }
    case ContentFileExtension.Markdown:
    default:
      return {
        ...baseDocument,
        ...parseMarkdownContent(content),
      }
  }
}

function normalizeForCompare(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => normalizeForCompare(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined && item !== null)
        .map(([key, item]) => [key, normalizeForCompare(item)]),
    )
  }

  return value
}

function areDocumentsEqual(document1: DatabaseItem, document2: DatabaseItem) {
  return isDeepEqual(
    normalizeForCompare(document1) as Record<string, unknown>,
    normalizeForCompare(document2) as Record<string, unknown>,
  )
}

async function generateContentFromTestDocument(document: DatabaseItem) {
  const cleaned = cleanDataKeys(document)

  switch (document.extension) {
    case ContentFileExtension.JSON:
      return JSON.stringify(cleaned, null, 2)
    case ContentFileExtension.YAML:
    case ContentFileExtension.YML:
      return jsonToYaml(cleaned)
    case ContentFileExtension.Markdown:
    default: {
      const frontmatter = cleaned
      const yaml = jsonToYaml(frontmatter)
      const markdownBody = Array.isArray((document.body as { value?: string[] })?.value)
        ? (document.body as { value: string[] }).value.join('\n')
        : ''

      return yaml
        ? `---\n${yaml}---\n\n${markdownBody}`
        : markdownBody
    }
  }
}

function pickReservedKeysFromDocument(document: DatabaseItem): DatabaseItem {
  return Object.fromEntries(
    Object.entries(document).filter(([key]) => reservedKeys.includes(key)),
  ) as DatabaseItem
}

function cleanDataKeys(document: DatabaseItem): DatabaseItem {
  const result = Object.fromEntries(
    Object.entries(document).filter(([key, value]) => !reservedKeys.includes(key) && value !== undefined && value !== null),
  ) as DatabaseItem

  if (document.meta && typeof document.meta === 'object') {
    Object.entries(document.meta as Record<string, unknown>).forEach(([key, value]) => {
      if (!reservedKeys.includes(key) && value !== undefined && value !== null) {
        result[key] = value
      }
    })
  }

  Object.keys(result).forEach((key) => {
    if (Array.isArray(result[key]) && (result[key] as unknown[]).length === 0) {
      Reflect.deleteProperty(result, key)
    }
  })

  return result
}

async function isDocumentMatchingContent(content: string, document: DatabaseItem) {
  const parsed = generateDocumentFromTestContent(document.id, document.fsPath!, content)
  return areDocumentsEqual(parsed, document)
}

export const createMockHost = (): StudioHost => {
  const collectionGetByFsPath = vi.fn<(fsPath: string) => CollectionInfo | undefined>().mockReturnValue(undefined)
  const collectionList = vi.fn<() => CollectionInfo[]>().mockReturnValue([])

  return ({
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
          const generatedDocument = generateDocumentFromTestContent(id, fsPath, content)

          const document = {
            ...createMockDocument(id, { fsPath }),
            ...generatedDocument,
          }

          documentDb.set(id, document)
          return document
        }),
        upsert: vi.fn().mockImplementation(async (fsPath: string, document: DatabaseItem) => {
          const id = fsPathToId(fsPath, 'document')
          documentDb.set(id, document)
        }),
        delete: vi.fn().mockImplementation(async (fsPath: string) => {
          const id = fsPathToId(fsPath, 'document')
          documentDb.delete(id)
        }),
        list: vi.fn().mockImplementation(async () => {
          return Array.from(documentDb.values())
        }),
      },
      utils: {
        areEqual: vi.fn().mockImplementation((document1: DatabaseItem, document2: DatabaseItem) => {
          return areDocumentsEqual(document1, document2)
        }),
        isMatchingContent: vi.fn().mockImplementation(async (content: string, document: DatabaseItem) => {
          return isDocumentMatchingContent(content, document)
        }),
        pickReservedKeys: vi.fn().mockImplementation((document: DatabaseItem) => {
          return pickReservedKeysFromDocument(document) as DatabaseItem
        }),
        cleanDataKeys: vi.fn().mockImplementation((document: DatabaseItem) => {
          return cleanDataKeys(document) as DatabaseItem
        }),
        detectActives: vi.fn().mockReturnValue([]),
      },
      generate: {
        documentFromContent: vi.fn().mockImplementation(async (id: string, content: string) => {
          return generateDocumentFromTestContent(id, idToFsPath(id), content)
        }),
        contentFromDocument: vi.fn().mockImplementation(async (document: DatabaseItem) => {
          return generateContentFromTestDocument(document)
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
        const id = fsPathToId(fsPath, 'media')
        mediaDb.set(id, media)
      }),
      delete: vi.fn().mockImplementation(async (fsPath: string) => {
        const id = fsPathToId(fsPath, 'media')
        mediaDb.delete(id)
      }),
      list: vi.fn().mockImplementation(async () => {
        return Array.from(mediaDb.values())
      }),
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
      getByFsPath: collectionGetByFsPath,
      list: collectionList,
    },
  } as never)
}

export const clearMockHost = () => {
  documentDb.clear()
  mediaDb.clear()
}
