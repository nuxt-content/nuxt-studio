import { describe, it, expect } from 'vitest'
import { areDocumentsEqual, contentFromMarkdownDocument, documentFromMarkdownContent, ensureComarkBody, isDocumentMatchingContent } from '../../src/runtime/utils/document'
import { markdownRootFromComarkTree } from '../../src/runtime/utils/document/legacy'
import type { ComarkTree } from 'comark'
import type { DatabaseItem } from 'nuxt-studio/app'

// Downgrades a comark document to the minimark body older Studio builds persisted.
async function legacyBodyOf(id: string, content: string): Promise<{ comark: DatabaseItem, legacy: DatabaseItem }> {
  const comark = await documentFromMarkdownContent(id, content) as DatabaseItem
  const legacy = { ...comark, body: markdownRootFromComarkTree(comark.body as unknown as ComarkTree) as unknown } as DatabaseItem
  return { comark, legacy }
}

describe('Document - Markdown roundtrip Integration Tests', () => {
  describe('hard breaks', () => {
    it('serializes a hard break as a markdown hard break, not :br', async () => {
      const document = await documentFromMarkdownContent('content:test.md', 'Line one  \nLine two')

      await expect(contentFromMarkdownDocument(document)).resolves.toBe('Line one  \nLine two\n')
    })

    it('round-trips a hard break idempotently (no blank-line accumulation)', async () => {
      const first = await documentFromMarkdownContent('content:test.md', 'Line one  \nLine two')
      const rendered = await contentFromMarkdownDocument(first)
      const second = await documentFromMarkdownContent('content:test.md', rendered!)

      await expect(contentFromMarkdownDocument(second)).resolves.toBe('Line one  \nLine two\n')
    })
  })

  describe('code block with component inside named slot', () => {
    it('preserves a code block inside an MDC component #code slot', async () => {
      const content = `::component
#code
\`\`\`mdc
::alert
hello
::
\`\`\`
::
`

      const document = await documentFromMarkdownContent('content:test.md', content)
      const markdown = await contentFromMarkdownDocument(document)

      expect(markdown!.trim()).toBe(content.trim())
    })
  })

  describe('code block with component without named slot', () => {
    it('preserves a code block inside an MDC component default slot', async () => {
      const content = `::component
\`\`\`mdc
::alert
hello
::
\`\`\`
::
`

      const document = await documentFromMarkdownContent('content:test.md', content)
      const markdown = await contentFromMarkdownDocument(document)

      expect(markdown!.trim()).toBe(content.trim())
    })
  })

  describe('non-comark stored bodies (drafts persisted by older Studio builds)', () => {
    const content = `# Hello

A paragraph with **bold** text.
`

    it('renders a legacy minimark body (no nodes) without throwing', async () => {
      const { legacy } = await legacyBodyOf('content:legacy.md', content)

      const markdown = await contentFromMarkdownDocument(legacy)

      expect(markdown!.trim()).toBe(content.trim())
    })

    it('renders a raw MarkdownRoot body ({type:"root", children}, no nodes) without throwing', async () => {
      const markdownRootBody = {
        type: 'root',
        children: [
          { type: 'element', tag: 'h1', props: {}, children: [{ type: 'text', value: 'Hello' }] },
          { type: 'element', tag: 'p', props: {}, children: [
            { type: 'text', value: 'A paragraph with ' },
            { type: 'element', tag: 'strong', props: {}, children: [{ type: 'text', value: 'bold' }] },
            { type: 'text', value: ' text.' },
          ] },
        ],
      }
      const document = { id: 'content:legacy.md', extension: 'md', stem: 'legacy', meta: {}, body: markdownRootBody } as unknown as DatabaseItem

      const markdown = await contentFromMarkdownDocument(document)

      expect(markdown!.trim()).toBe(content.trim())
    })

    it('renders a legacy body containing an MDC component without throwing', async () => {
      const componentContent = '::alert{type="info"}\nhello\n::\n'
      const { legacy } = await legacyBodyOf('content:legacy.md', componentContent)

      const markdown = await contentFromMarkdownDocument(legacy)

      expect(markdown!.trim()).toBe(componentContent.trim())
    })

    it('returns an empty document for a markdown body that is missing entirely', async () => {
      const document = { id: 'content:empty.md', extension: 'md', stem: 'empty', meta: {} } as DatabaseItem

      const markdown = await contentFromMarkdownDocument(document)

      expect(markdown).toBe('\n')
    })

    it('treats a legacy body and its comark equivalent as equal', async () => {
      const { comark, legacy } = await legacyBodyOf('content:page.md', content)

      expect(await areDocumentsEqual(legacy, comark)).toBe(true)
    })

    it('matches a legacy body against its own raw markdown content', async () => {
      const { legacy } = await legacyBodyOf('content:legacy.md', content)

      expect(await isDocumentMatchingContent(content, legacy)).toBe(true)
    })
  })

  describe('ensureComarkBody', () => {
    it('upgrades a legacy body to a ComarkTree (adds .nodes)', async () => {
      const { legacy } = await legacyBodyOf('content:legacy.md', '# Hello\n')

      const upgraded = ensureComarkBody(legacy)

      expect(Array.isArray((upgraded.body as ComarkTree).nodes)).toBe(true)
    })

    it('returns an already-comark document untouched (no re-parse)', async () => {
      const comark = await documentFromMarkdownContent('content:comark.md', '# Hello\n') as DatabaseItem

      expect(ensureComarkBody(comark)).toBe(comark)
    })

    it('returns a non-markdown document untouched', () => {
      const yamlDoc = { id: 'content:data.yml', extension: 'yml', body: { some: 'value' } } as unknown as DatabaseItem

      expect(ensureComarkBody(yamlDoc)).toBe(yamlDoc)
    })

    it('returns a bodyless document untouched', () => {
      const document = { id: 'content:empty.md', extension: 'md' } as DatabaseItem

      expect(ensureComarkBody(document)).toBe(document)
    })

    it('is idempotent', async () => {
      const { legacy } = await legacyBodyOf('content:legacy.md', '# Hello\n')

      const once = ensureComarkBody(legacy)

      expect(ensureComarkBody(once)).toBe(once)
    })
  })
})
