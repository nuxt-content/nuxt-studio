import { describe, it, expect, beforeEach, vi } from 'vitest'
import { joinURL } from 'ufo'
import { DraftStatus, StudioItemActionId, TreeRootId, StudioFeature, type StudioHost, type TreeItem } from '../../src/types'
import { normalizeKey, generateUniqueDocumentId, generateUniqueMediaId, generateUniqueMediaName } from '../utils'
import { createMockHost, clearMockHost } from '../mocks/host'
import { createMockGit } from '../mocks/git'
import { createMockFile, createMockMedia, setupMediaMocks } from '../mocks/media'
import { createMockDocument } from '../mocks/document'
import { createMockStorage } from '../mocks/composables'
import type { useGit } from '../../src/composables/useGit'
import { findItemFromFsPath } from '../../src/utils/tree'

const mockStorageDraft = createMockStorage()
const mockHost = createMockHost()
const mockGit = createMockGit()

let currentRouteName = 'content'

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
      return currentRouteName
    },
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const cleanAndSetupContext = async (mockedHost: StudioHost, mockedGit: ReturnType<typeof useGit>) => {
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

describe('Document - Action Chains Integration Tests', () => {
  let filename: string
  let documentId: string
  let documentFsPath: string
  let collection: string
  let context: Awaited<ReturnType<typeof cleanAndSetupContext>>

  beforeEach(async () => {
    currentRouteName = 'content'
    collection = 'docs'
    filename = 'document'
    documentId = generateUniqueDocumentId(filename, collection)
    documentFsPath = mockHost.document.getFileSystemPath(documentId)
    context = await cleanAndSetupContext(mockHost, mockGit)
  })

  it('Create > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    /* STEP 1: CREATE */
    await context.itemActionHandler[StudioItemActionId.CreateDocument]({
      fsPath: documentFsPath,
      content: 'Test content',
    })

    // Draft in Storage
    expect(mockStorageDraft.size).toEqual(1)
    const storedDraft = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(storedDraft).toHaveProperty('status', DraftStatus.Created)
    expect(storedDraft).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('body', {
      type: 'minimark',
      value: ['Test content'],
    })
    expect(storedDraft.original).toBeUndefined()

    // Draft in Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    expect(context.activeTree.value.draft.list.value[0]).toHaveProperty('id', documentId)
    expect(context.activeTree.value.draft.list.value[0].modified).toHaveProperty('id', documentId)
    expect(context.activeTree.value.draft.list.value[0].original).toBeUndefined()

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)

    /* STEP 2: REVERT */
    await context.itemActionHandler[StudioItemActionId.RevertItem](context.activeTree.value.currentItem.value)

    // Draft in Storage
    expect(mockStorageDraft.size).toEqual(0)

    // Draft In memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(0)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(0)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.revert')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
  })

  it('Create > Rename', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')
    /* STEP 1: CREATE */
    await context.itemActionHandler[StudioItemActionId.CreateDocument]({
      fsPath: documentFsPath,
      content: 'Test content',
    })

    /* STEP 2: RENAME */
    const newId = generateUniqueDocumentId()
    const newFsPath = mockHost.document.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      newFsPath,
      item: {
        type: 'file',
        fsPath: documentFsPath,
        collections: [collection],
      } as TreeItem,
    })

    // Draft in Storage
    expect(mockStorageDraft.size).toEqual(1)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId)
    expect(createdDraftStorage.original).toBeUndefined()
    expect(createdDraftStorage.modified).toHaveProperty('id', newId)

    // Draft in Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(1)
    expect(list[0].status).toEqual(DraftStatus.Created)
    expect(list[0].id).toEqual(newId)
    expect(list[0].original).toBeUndefined()
    expect(list[0].modified).toHaveProperty('id', newId)

    // Tree
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('status', DraftStatus.Created)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
  })

  it('Create > Update > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    /* STEP 1: CREATE */
    await context.itemActionHandler[StudioItemActionId.CreateDocument]({
      fsPath: documentFsPath,
      content: 'Test content',
    })

    /* STEP 2: UPDATE */
    const updatedDocument = createMockDocument(documentId, {
      body: {
        type: 'minimark',
        value: ['Updated content'],
      },
    })
    await context.activeTree.value.draft.update(documentId, updatedDocument)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const storedDraft = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(storedDraft).toHaveProperty('status', DraftStatus.Created)
    expect(storedDraft).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('body', updatedDocument.body)
    expect(storedDraft.original).toBeUndefined()

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    expect(context.activeTree.value.draft.list.value[0].status).toEqual(DraftStatus.Created)
    expect(context.activeTree.value.draft.list.value[0]).toHaveProperty('id', documentId)
    expect(context.activeTree.value.draft.list.value[0].original).toBeUndefined()
    expect(context.activeTree.value.draft.list.value[0].modified).toHaveProperty('id', updatedDocument.id)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)

    /* STEP 3: REVERT */
    await context.itemActionHandler[StudioItemActionId.RevertItem](context.activeTree.value.currentItem.value)

    // Storage
    expect(mockStorageDraft.size).toEqual(0)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(0)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(0)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.revert')
  })

  it('Select > Update > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create document in db and load tree
    await mockHost.document.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const selectedDraft = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(selectedDraft).toHaveProperty('status', DraftStatus.Pristine)
    expect(selectedDraft).toHaveProperty('id', documentId)
    expect(selectedDraft.modified).toHaveProperty('id', documentId)
    expect(selectedDraft.original).toHaveProperty('id', documentId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    expect(context.activeTree.value.draft.list.value[0].status).toEqual(DraftStatus.Pristine)
    expect(context.activeTree.value.draft.list.value[0]).toHaveProperty('id', documentId)
    expect(context.activeTree.value.draft.list.value[0].modified).toHaveProperty('id', documentId)
    expect(context.activeTree.value.draft.list.value[0].original).toHaveProperty('id', documentId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)

    /* STEP 2: UPDATE */
    const updatedDocument = createMockDocument(documentId, {
      body: {
        type: 'minimark',
        value: ['Updated content'],
      },
    })
    await context.activeTree.value.draft.update(documentId, updatedDocument)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const storedDraft = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(storedDraft).toHaveProperty('status', DraftStatus.Updated)
    expect(storedDraft).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('id', documentId)
    expect(storedDraft.modified).toHaveProperty('body', updatedDocument.body)
    expect(storedDraft.original).toHaveProperty('id', documentId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    expect(context.activeTree.value.draft.list.value[0].status).toEqual(DraftStatus.Updated)
    expect(context.activeTree.value.draft.list.value[0]).toHaveProperty('id', documentId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)
    expect(context.activeTree.value.root.value[0].status).toEqual('updated')

    /* STEP 3: REVERT */
    await context.itemActionHandler[StudioItemActionId.RevertItem](context.activeTree.value.currentItem.value)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const revertedDraft = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(revertedDraft).toHaveProperty('status', DraftStatus.Pristine)
    expect(revertedDraft).toHaveProperty('id', documentId)
    expect(revertedDraft.modified).toHaveProperty('id', documentId)
    expect(revertedDraft.original).toHaveProperty('id', documentId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    expect(context.activeTree.value.draft.list.value[0].status).toEqual(DraftStatus.Pristine)
    expect(context.activeTree.value.draft.list.value[0]).toHaveProperty('id', documentId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.update')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.revert')
  })

  it('Select > Update > Rename', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create document in db and load tree
    await mockHost.document.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    /* STEP 2: UPDATE */
    const updatedDocument = createMockDocument(documentId, {
      body: {
        type: 'minimark',
        value: ['Updated content'],
      },
    })
    await context.activeTree.value.draft.update(documentId, updatedDocument)

    /* STEP 3: RENAME */
    const newId = generateUniqueDocumentId()
    const newFsPath = mockHost.document.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: documentFsPath,
        collections: [collection],
      } as TreeItem,
      newFsPath,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Created renamed draft
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId)
    expect(createdDraftStorage.original).toHaveProperty('id', documentId)
    expect(createdDraftStorage.modified).toHaveProperty('id', newId)
    expect(createdDraftStorage.modified).toHaveProperty('body', updatedDocument.body)

    // Deleted original draft
    const deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.original).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.modified).toBeUndefined()

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(2)

    expect(list[0].status).toEqual(DraftStatus.Deleted)
    expect(list[0].id).toEqual(documentId)
    expect(list[0].original).toHaveProperty('id', documentId)
    expect(list[0].modified).toBeUndefined()

    expect(list[1].status).toEqual(DraftStatus.Created)
    expect(list[1].id).toEqual(newId)
    expect(list[1].original).toHaveProperty('id', documentId)
    expect(list[1].modified).toHaveProperty('id', newId)
    expect(list[1].modified).toHaveProperty('body', updatedDocument.body)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.update')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
  })

  it('Select > Rename > Update', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create document in db and load tree
    await mockHost.document.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    /* STEP 2: RENAME */
    const newId = generateUniqueDocumentId()
    const newFsPath = mockHost.document.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: documentFsPath,
        collections: [collection],
      } as TreeItem,
      newFsPath,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Created renamed draft
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId)
    expect(createdDraftStorage.original).toHaveProperty('id', documentId)
    expect(createdDraftStorage.modified).toHaveProperty('id', newId)

    // Deleted original draft
    let deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.original).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.modified).toBeUndefined()

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(2)

    // Deleted original draft
    let deletedDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === documentId)
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory!.original).toHaveProperty('id', documentId)
    expect(deletedDraftMemory!.modified).toBeUndefined()

    // Created renamed draft
    const createdDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === newId)
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', newId)
    expect(createdDraftMemory!.original).toHaveProperty('id', documentId)
    expect(createdDraftMemory!.modified).toHaveProperty('id', newId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)

    /* STEP 3: UPDATE */
    const updatedDocument = createMockDocument(newId, {
      body: {
        type: 'minimark',
        value: ['Updated content'],
      },
    })
    await context.activeTree.value.draft.update(newId, updatedDocument)

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Updated renamed draft
    const updatedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(updatedDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(updatedDraftStorage).toHaveProperty('id', newId)
    expect(updatedDraftStorage.original).toHaveProperty('id', documentId)
    expect(updatedDraftStorage.modified).toHaveProperty('id', newId)
    expect(updatedDraftStorage.modified).toHaveProperty('body', updatedDocument.body)

    // Deleted original draft
    deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.original).toHaveProperty('id', documentId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(2)

    // Deleted original draft
    deletedDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === documentId)
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory!.original).toHaveProperty('id', documentId)
    expect(deletedDraftMemory!.modified).toBeUndefined()

    // Renamed original draft
    const updatedDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === newId)!
    expect(updatedDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(updatedDraftMemory).toHaveProperty('id', newId)
    expect(updatedDraftMemory!.original).toHaveProperty('id', documentId)
    expect(updatedDraftMemory!.modified).toHaveProperty('id', newId)
    expect(updatedDraftMemory!.modified).toHaveProperty('body', updatedDocument.body)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(3)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.load')
    // Update is not called because status is the same (from created to created)
    expect(consoleInfoSpy).not.toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.update')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
  })

  it('Select > Rename > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create document in db and load tree
    await mockHost.document.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    /* STEP 2: RENAME */
    const newId = generateUniqueDocumentId()
    const newFsPath = mockHost.document.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: documentFsPath,
        collections: [collection],
      } as TreeItem,
      newFsPath,
    })

    /* STEP 3: REVERT */
    const renamedTreeItem = context.activeTree.value.root.value[0]
    expect(renamedTreeItem).toHaveProperty('fsPath', newFsPath)

    await context.itemActionHandler[StudioItemActionId.RevertItem](renamedTreeItem)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const openedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(openedDraftStorage).toHaveProperty('status', DraftStatus.Pristine)
    expect(openedDraftStorage).toHaveProperty('id', documentId)
    expect(openedDraftStorage.modified).toHaveProperty('id', documentId)
    expect(openedDraftStorage.original).toHaveProperty('id', documentId)

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(1)
    expect(list[0]).toHaveProperty('status', DraftStatus.Pristine)
    expect(list[0]).toHaveProperty('id', documentId)
    expect(list[0].modified).toHaveProperty('id', documentId)
    expect(list[0].original).toHaveProperty('id', documentId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', documentFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.revert')
  })

  it('Select > Rename > Rename', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create document in db and load tree
    await mockHost.document.create(documentFsPath, 'Test content')
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(documentFsPath)

    /* STEP 2: RENAME */
    const newId = generateUniqueDocumentId()
    const newFsPath = mockHost.document.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: documentFsPath,
        collections: [collection],
      } as TreeItem,
      newFsPath,
    })

    /* STEP 3: RENAME */
    const newId2 = generateUniqueDocumentId()
    const newFsPath2 = mockHost.document.getFileSystemPath(newId2)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: newFsPath,
        collections: [collection],
      } as TreeItem,
      newFsPath: newFsPath2,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Created renamed draft (newId2)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId2))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId2)
    expect(createdDraftStorage.original).toHaveProperty('id', documentId)
    expect(createdDraftStorage.modified).toHaveProperty('id', newId2)

    // Deleted original draft (documentId)
    const deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(documentId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.original).toHaveProperty('id', documentId)
    expect(deletedDraftStorage.modified).toBeUndefined()

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(2)

    // Created renamed draft (newId2)
    const createdDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === newId2)!
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', newId2)
    expect(createdDraftMemory.original).toHaveProperty('id', documentId)
    expect(createdDraftMemory.modified).toHaveProperty('id', newId2)

    // Deleted original draft (documentId)
    const deletedDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === documentId)!
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory).toHaveProperty('id', documentId)
    expect(deletedDraftMemory.original).toHaveProperty('id', documentId)
    expect(deletedDraftMemory.modified).toBeUndefined()

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath2)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:document:updated have been called by', 'useDraftDocuments.rename')
  })
})

describe('Media - Action Chains Integration Tests', () => {
  let context: Awaited<ReturnType<typeof cleanAndSetupContext>>
  let mediaName: string
  let mediaId: string
  let mediaFsPath: string
  const parentPath = '/'

  beforeEach(async () => {
    setupMediaMocks()

    currentRouteName = 'media'
    mediaName = generateUniqueMediaName()
    mediaId = joinURL(TreeRootId.Media, mediaName)
    mediaFsPath = mockHost.media.getFileSystemPath(mediaId)
    context = await cleanAndSetupContext(mockHost, mockGit)
  })

  it('Upload > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')
    const file = createMockFile(mediaName)

    /* STEP 1: UPLOAD */
    await context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: parentPath,
      files: [file],
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', mediaId)
    expect(createdDraftStorage.original).toBeUndefined()
    expect(createdDraftStorage.modified).toHaveProperty('id', mediaId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    const createdDraftMemory = context.activeTree.value.draft.list.value[0]
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', mediaId)
    expect(createdDraftMemory.original).toBeUndefined()
    expect(createdDraftMemory.modified).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', mediaFsPath)

    /* STEP 2: REVERT */
    const mediaTreeItem = context.activeTree.value.root.value[0]
    await context.itemActionHandler[StudioItemActionId.RevertItem](mediaTreeItem)

    // Storage
    expect(mockStorageDraft.size).toEqual(0)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(0)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(0)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.revert')
  })

  it('Upload > Rename', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')
    const file = createMockFile(mediaName)

    /* STEP 1: UPLOAD */
    await context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: parentPath,
      files: [file],
    })

    /* STEP 2: RENAME */
    const newId = generateUniqueMediaId()
    const newFsPath = mockHost.media.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: mediaFsPath,
        collections: [TreeRootId.Media],
      } as TreeItem,
      newFsPath,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId)
    expect(createdDraftStorage.original).toBeUndefined()
    expect(createdDraftStorage.modified).toHaveProperty('id', newId)

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(1)
    expect(list[0].status).toEqual(DraftStatus.Created)
    expect(list[0].id).toEqual(newId)
    expect(list[0].original).toBeUndefined()
    expect(list[0].modified).toHaveProperty('id', newId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('status', DraftStatus.Created)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(2)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftMedias.rename')
  })

  it('Select > Delete > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create media in db and load tree
    await mockHost.media.upsert(mediaId, createMockMedia(mediaId))
    await context.activeTree.value.draft.load()

    /* STEP 1: SELECT */
    await context.activeTree.value.selectItemByFsPath(mediaFsPath)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Pristine)
    expect(createdDraftStorage).toHaveProperty('id', mediaId)
    expect(createdDraftStorage.original).toHaveProperty('id', mediaId)
    expect(createdDraftStorage.modified).toHaveProperty('id', mediaId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    const createdDraftMemory = context.activeTree.value.draft.list.value[0]
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Pristine)
    expect(createdDraftMemory).toHaveProperty('id', mediaId)
    expect(createdDraftMemory.original).toHaveProperty('id', mediaId)
    expect(createdDraftMemory.modified).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', mediaFsPath)

    /* STEP 2: DELETE */
    const itemTreeToDelete = findItemFromFsPath(context.activeTree.value.root.value, mediaFsPath)
    await context.itemActionHandler[StudioItemActionId.DeleteItem](itemTreeToDelete!)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', mediaId)
    expect(deletedDraftStorage.modified).toBeUndefined()
    expect(deletedDraftStorage.original).toHaveProperty('id', mediaId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    const deletedDraftMemory = context.activeTree.value.draft.list.value[0]
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory).toHaveProperty('id', mediaId)
    expect(deletedDraftMemory.modified).toBeUndefined()
    expect(deletedDraftMemory.original).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', mediaFsPath)

    /* STEP 3: REVERT */
    const mediaTreeItem = context.activeTree.value.root.value[0]
    await context.itemActionHandler[StudioItemActionId.RevertItem](mediaTreeItem)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const revertedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(revertedDraftStorage).toHaveProperty('status', DraftStatus.Pristine)
    expect(revertedDraftStorage).toHaveProperty('id', mediaId)
    expect(revertedDraftStorage.modified).toBeDefined()
    expect(revertedDraftStorage.original).toHaveProperty('id', mediaId)

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(1)
    expect(list[0]).toHaveProperty('status', DraftStatus.Pristine)
    expect(list[0]).toHaveProperty('id', mediaId)
    expect(list[0].modified).toBeDefined()
    expect(list[0].original).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', mediaFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.remove')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.revert')
  })

  it('Rename > Revert', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create media in db and load tree
    await mockHost.media.upsert(mediaId, { id: mediaId, stem: mediaName.split('.')[0], extension: mediaName.split('.')[1] })
    await context.activeTree.value.draft.load()

    /* STEP 1: RENAME */
    await context.activeTree.value.selectItemByFsPath(mediaFsPath)

    const newId = generateUniqueMediaId()
    const newFsPath = mockHost.media.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: mediaFsPath,
        collections: [TreeRootId.Media],
      } as TreeItem,
      newFsPath,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Created renamed draft
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId)
    expect(createdDraftStorage.original).toHaveProperty('id', mediaId)
    expect(createdDraftStorage.modified).toHaveProperty('id', newId)

    // Deleted original draft
    const deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', mediaId)
    expect(deletedDraftStorage.modified).toBeUndefined()
    expect(deletedDraftStorage.original).toHaveProperty('id', mediaId)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(2)

    // Created renamed draft
    const createdDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === newId)!
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', newId)
    expect(createdDraftMemory.modified).toHaveProperty('id', newId)
    expect(createdDraftMemory.original).toHaveProperty('id', mediaId)

    // Deleted original draft
    const deletedDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === mediaId)!
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory).toHaveProperty('id', mediaId)
    expect(deletedDraftMemory.modified).toBeUndefined()
    expect(deletedDraftMemory.original).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath)

    /* STEP 2: REVERT */
    const renamedTreeItem = context.activeTree.value.root.value[0]
    expect(renamedTreeItem).toHaveProperty('fsPath', newFsPath)
    await context.itemActionHandler[StudioItemActionId.RevertItem](renamedTreeItem)

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const revertedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(revertedDraftStorage).toHaveProperty('status', DraftStatus.Pristine)
    expect(revertedDraftStorage).toHaveProperty('id', mediaId)
    expect(revertedDraftStorage.modified).toHaveProperty('id', mediaId)
    expect(revertedDraftStorage.original).toHaveProperty('id', mediaId)

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(1)
    expect(list[0]).toHaveProperty('status', DraftStatus.Pristine)
    expect(list[0]).toHaveProperty('id', mediaId)
    expect(list[0].modified).toHaveProperty('id', mediaId)
    expect(list[0].original).toHaveProperty('id', mediaId)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', mediaFsPath)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftMedias.rename')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.revert')
  })

  it('Rename > Rename', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')

    // Create media in db and load tree
    await mockHost.media.upsert(mediaId, { id: mediaId, stem: mediaName.split('.')[0], extension: mediaName.split('.')[1] })
    await context.activeTree.value.draft.load()

    /* STEP 1: RENAME */
    await context.activeTree.value.selectItemByFsPath(mediaFsPath)

    const newId = generateUniqueMediaId()
    const newFsPath = mockHost.media.getFileSystemPath(newId)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      newFsPath,
      item: {
        type: 'file',
        fsPath: mediaFsPath,
        collections: [TreeRootId.Media],
      } as TreeItem,
    })

    /* STEP 2: RENAME */
    const newId2 = generateUniqueMediaId()
    const newFsPath2 = mockHost.media.getFileSystemPath(newId2)
    await context.itemActionHandler[StudioItemActionId.RenameItem]({
      item: {
        type: 'file',
        fsPath: newFsPath,
        collections: [TreeRootId.Media],
      } as TreeItem,
      newFsPath: newFsPath2,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(2)

    // Created renamed draft
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(newId2))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', newId2)
    expect(createdDraftStorage.original).toHaveProperty('id', mediaId)
    expect(createdDraftStorage.modified).toHaveProperty('id', newId2)

    // Deleted original draft
    const deletedDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(mediaId))!)
    expect(deletedDraftStorage).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftStorage).toHaveProperty('id', mediaId)
    expect(deletedDraftStorage.modified).toBeUndefined()
    expect(deletedDraftStorage.original).toHaveProperty('id', mediaId)

    // Memory
    const list = context.activeTree.value.draft.list.value
    expect(list).toHaveLength(2)

    // Created renamed draft
    const createdDraftMemory = list.find(item => item.id === newId2)!
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', newId2)
    expect(createdDraftMemory.modified).toHaveProperty('id', newId2)
    expect(createdDraftMemory.original).toHaveProperty('id', mediaId)

    // Deleted original draft
    const deletedDraftMemory = list.find(item => item.id === mediaId)!
    expect(deletedDraftMemory).toHaveProperty('status', DraftStatus.Deleted)
    expect(deletedDraftMemory).toHaveProperty('id', mediaId)
    expect(deletedDraftMemory.original).toHaveProperty('id', mediaId)
    expect(deletedDraftMemory.modified).toBeUndefined()

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(1)
    expect(context.activeTree.value.root.value[0]).toHaveProperty('fsPath', newFsPath2)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(4)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.load')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftMedias.rename')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftMedias.rename')
  })

  it('CreateFolder > Upload > Revert Media', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')
    const folderName = 'media-folder'
    const folderPath = `/${folderName}`
    const gitkeepId = joinURL(TreeRootId.Media, folderPath, '.gitkeep')
    const gitkeepFsPath = mockHost.media.getFileSystemPath(gitkeepId)

    /* STEP 1: CREATE FOLDER */
    await context.itemActionHandler[StudioItemActionId.CreateMediaFolder]({
      fsPath: folderPath,
    })

    // Storage
    expect(mockStorageDraft.size).toEqual(1)
    const gitkeepDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(gitkeepId))!)
    expect(gitkeepDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(gitkeepDraftStorage).toHaveProperty('id', gitkeepId)
    expect(gitkeepDraftStorage.modified).toHaveProperty('id', gitkeepId)
    expect(gitkeepDraftStorage.original).toBeUndefined()

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    const gitkeepDraftMemory = context.activeTree.value.draft.list.value[0]
    expect(gitkeepDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(gitkeepDraftMemory).toHaveProperty('id', gitkeepId)
    expect(gitkeepDraftMemory.modified).toHaveProperty('id', gitkeepId)
    expect(gitkeepDraftMemory.original).toBeUndefined()

    // Tree - .gitkeep file exists but is hidden
    let rootTree = context.activeTree.value.root.value
    expect(rootTree).toHaveLength(1)
    expect(rootTree[0]).toHaveProperty('type', 'directory')
    expect(rootTree[0]).toHaveProperty('name', folderName)
    expect(rootTree[0].children).toHaveLength(1)
    expect(rootTree[0].children![0]).toHaveProperty('fsPath', gitkeepFsPath)
    expect(rootTree[0].children![0]).toHaveProperty('hide', true)

    /* STEP 2: UPLOAD MEDIA IN FOLDER */
    const file = createMockFile(mediaName)
    const uploadedMediaId = joinURL(TreeRootId.Media, folderPath, mediaName)
    const uploadedMediaFsPath = mockHost.media.getFileSystemPath(uploadedMediaId)
    await context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: folderPath,
      files: [file],
    })

    // Storage - .gitkeep has been removed
    expect(mockStorageDraft.size).toEqual(1)
    const createdDraftStorage = JSON.parse(mockStorageDraft.get(normalizeKey(uploadedMediaId))!)
    expect(createdDraftStorage).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftStorage).toHaveProperty('id', uploadedMediaId)
    expect(createdDraftStorage.original).toBeUndefined()
    expect(createdDraftStorage.modified).toHaveProperty('id', uploadedMediaId)

    // Memory - .gitkeep has been removed
    expect(context.activeTree.value.draft.list.value).toHaveLength(1)
    const createdDraftMemory = context.activeTree.value.draft.list.value.find(item => item.id === uploadedMediaId)!
    expect(createdDraftMemory).toHaveProperty('status', DraftStatus.Created)
    expect(createdDraftMemory).toHaveProperty('id', uploadedMediaId)
    expect(createdDraftMemory.modified).toHaveProperty('id', uploadedMediaId)
    expect(createdDraftMemory.original).toBeUndefined()

    // Tree - .gitkeep has been removed
    rootTree = context.activeTree.value.root.value
    expect(rootTree).toHaveLength(1)
    expect(rootTree[0]).toHaveProperty('type', 'directory')
    expect(rootTree[0]).toHaveProperty('name', folderName)
    expect(rootTree[0].children).toHaveLength(1)
    expect(rootTree[0].children![0]).toHaveProperty('fsPath', uploadedMediaFsPath)

    /* STEP 3: REVERT UPLOADED MEDIA */
    const uploadedMediaTreeItem = context.activeTree.value.root.value[0].children!.find(item => item.fsPath === uploadedMediaFsPath)!
    await context.itemActionHandler[StudioItemActionId.RevertItem](uploadedMediaTreeItem!)

    // Storage
    expect(mockStorageDraft.size).toEqual(0)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(0)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(0)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(3)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.revert')
  })

  it('CreateMediaFolder > Upload > Revert Media', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info')
    const folderName = 'media-folder'
    const folderPath = `/${folderName}`

    /* STEP 1: CREATE MEDIA FOLDER */
    await context.itemActionHandler[StudioItemActionId.CreateMediaFolder]({
      fsPath: folderPath,
    })

    /* STEP 2: UPLOAD MEDIA IN FOLDER */
    const file = createMockFile(mediaName)
    await context.itemActionHandler[StudioItemActionId.UploadMedia]({
      parentFsPath: folderPath,
      files: [file],
    })

    /* STEP 3: REVERT FOLDER */
    const folderTreeItem = context.activeTree.value.root.value[0]
    await context.itemActionHandler[StudioItemActionId.RevertItem](folderTreeItem!)

    // Storage
    expect(mockStorageDraft.size).toEqual(0)

    // Memory
    expect(context.activeTree.value.draft.list.value).toHaveLength(0)

    // Tree
    expect(context.activeTree.value.root.value).toHaveLength(0)

    // Hooks
    expect(consoleInfoSpy).toHaveBeenCalledTimes(3)
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.create')
    expect(consoleInfoSpy).toHaveBeenCalledWith('studio:draft:media:updated have been called by', 'useDraftBase.revert')
  })
})
