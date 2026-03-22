import { describe, it, expect } from 'vitest'
import { findDescendantsFromFsPath, getMarkdownFormattingChange, getPristineMarkdownRemoteContent, shouldShowMarkdownFormattingBanner } from '../../../src/utils/draft'
import { draftItemsList } from '../../../test/mocks/draft'
import { createMockHost } from '../../mocks/host'
import { createMockDocument } from '../../mocks/document'
import { createMockGithubFile } from '../../mocks/git'
import { ContentFileExtension, DraftStatus } from '../../../src/types'

describe('findDescendantsFromFsPath', () => {
  it('returns exact match for a root level file', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, 'index.md')
    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('index.md')
  })

  it('returns empty array for non-existent fsPath', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, 'non-existent/file.md')
    expect(descendants).toHaveLength(0)
  })

  it('returns all descendants files for a directory path', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started')

    expect(descendants).toHaveLength(5)

    expect(descendants.some(item => item.fsPath === '1.getting-started/2.introduction.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/3.installation.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/4.configuration.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for a nested directory path', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started/1.advanced')

    expect(descendants).toHaveLength(2)

    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/1.studio.md')).toBe(true)
    expect(descendants.some(item => item.fsPath === '1.getting-started/1.advanced/2.deployment.md')).toBe(true)
  })

  it('returns all descendants for root item', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '/')

    expect(descendants).toHaveLength(draftItemsList.length)
  })

  it('returns only the file itself when searching for a specific file', () => {
    const descendants = findDescendantsFromFsPath(draftItemsList, '1.getting-started/1.advanced/1.studio.md')

    expect(descendants).toHaveLength(1)
    expect(descendants[0].fsPath).toBe('1.getting-started/1.advanced/1.studio.md')
  })
})

describe('getMarkdownFormattingChange', () => {
  it('returns formatting metadata when markdown source would be rewritten', async () => {
    const host = createMockHost()
    const document = createMockDocument('docs/formatting.md', {
      fsPath: 'formatting.md',
      body: {
        type: 'minimark',
        value: ['- one', '- two'],
      },
    })

    const formatting = await getMarkdownFormattingChange(host, {
      fsPath: 'formatting.md',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/formatting.md',
        content: '* one\n* two\n',
      }),
    })

    expect(formatting).toEqual({
      originalContent: '* one\n* two\n',
      formattedContent: '- one\n- two',
    })
  })

  it('returns undefined when markdown source already matches canonical content', async () => {
    const host = createMockHost()
    const document = createMockDocument('docs/formatting.md', {
      fsPath: 'formatting.md',
      body: {
        type: 'minimark',
        value: ['- one', '- two'],
      },
    })

    const formatting = await getMarkdownFormattingChange(host, {
      fsPath: 'formatting.md',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/formatting.md',
        content: '- one\n- two\n',
      }),
    })

    expect(formatting).toBeUndefined()
  })

  it('returns undefined for non-markdown files', async () => {
    const host = createMockHost()
    const document = createMockDocument('docs/formatting.yml', {
      fsPath: 'formatting.yml',
      extension: 'yml',
    })

    const formatting = await getMarkdownFormattingChange(host, {
      fsPath: 'formatting.yml',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/formatting.yml',
        content: 'title: Example\n',
      }),
    })

    expect(formatting).toBeUndefined()
  })
})

describe('getPristineMarkdownRemoteContent', () => {
  it('returns remote source for existing pristine markdown drafts', () => {
    const document = createMockDocument('docs/blog/post.md', {
      fsPath: 'blog/post.md',
    })

    const content = getPristineMarkdownRemoteContent({
      fsPath: 'blog/post.md',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/blog/post.md',
        content: '* one\n* two\n',
      }),
    })

    expect(content).toBe('* one\n* two\n')
  })

  it('returns undefined for pristine non-markdown drafts', () => {
    const document = createMockDocument('docs/data/post.yml', {
      fsPath: 'data/post.yml',
      extension: ContentFileExtension.YAML,
    })

    const content = getPristineMarkdownRemoteContent({
      fsPath: 'data/post.yml',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/data/post.yml',
        content: 'title: Example\n',
      }),
    })

    expect(content).toBeUndefined()
  })

  it('returns undefined for newly created markdown drafts', () => {
    const document = createMockDocument('docs/blog/new-post.md', {
      fsPath: 'blog/new-post.md',
    })

    const content = getPristineMarkdownRemoteContent({
      fsPath: 'blog/new-post.md',
      status: DraftStatus.Created,
      modified: document,
      remoteFile: createMockGithubFile({
        path: 'content/blog/new-post.md',
        content: '# New post\n',
      }),
    })

    expect(content).toBeUndefined()
  })
})

describe('shouldShowMarkdownFormattingBanner', () => {
  it('hides the formatting banner for pristine drafts', () => {
    const document = createMockDocument('docs/blog/post.md', {
      fsPath: 'blog/post.md',
    })

    expect(shouldShowMarkdownFormattingBanner({
      fsPath: 'blog/post.md',
      status: DraftStatus.Pristine,
      original: document,
      modified: document,
      formatting: {
        originalContent: '* one\n* two\n',
        formattedContent: '- one\n- two',
      },
    })).toBe(false)
  })

  it('shows the formatting banner after a real edit', () => {
    const document = createMockDocument('docs/blog/post.md', {
      fsPath: 'blog/post.md',
    })

    expect(shouldShowMarkdownFormattingBanner({
      fsPath: 'blog/post.md',
      status: DraftStatus.Updated,
      original: document,
      modified: document,
      formatting: {
        originalContent: '* one\n* two\n',
        formattedContent: '- one\n- two',
      },
    })).toBe(true)
  })
})
