import { describe, it, expect } from 'vitest'
import { parseMarkdown as parseWithMdc } from '@nuxtjs/mdc/runtime'
import type { MDCNode, MDCRoot } from '@nuxtjs/mdc'
import { decompressTree } from '@nuxt/content/runtime'
import { parseMarkdown as parseWithComark } from 'comark'
import { areDocumentsEqual, contentFromMarkdownDocument, documentFromMarkdownContent, ensureComarkBody, isDocumentMatchingContent } from '../../src/runtime/utils/document'
import { markdownRootFromComarkTree } from '../../src/runtime/utils/document/legacy'
import type { MarkdownDocument } from 'comark'
import type { DatabaseItem } from 'nuxt-studio/app'

// Downgrades a comark document to the minimark body older Studio builds persisted.
async function legacyBodyOf(id: string, content: string): Promise<{ comark: DatabaseItem, legacy: DatabaseItem }> {
  const comark = await documentFromMarkdownContent(id, content) as DatabaseItem
  const legacy = { ...comark, body: markdownRootFromComarkTree(comark.body as unknown as MarkdownDocument) as unknown } as DatabaseItem
  return { comark, legacy }
}

// Without a highlighter mdc keeps a `language-*` class on fences, which @nuxt/content's shiki output doesn't have.
function dropFenceClass(node: MDCNode): MDCNode {
  if (node.type !== 'element') return node
  const props = node.tag === 'pre' ? { ...node.props, className: undefined } : node.props
  return { ...node, props, children: node.children?.map(dropFenceClass) }
}

// The body @nuxt/content stores for a page, which is what Studio saves from.
async function storedDocumentOf(content: string): Promise<DatabaseItem> {
  const { body } = await parseWithMdc(content, { highlight: false, toc: false })
  const stored: MDCRoot = { ...body, children: body.children.map(dropFenceClass) }
  return { id: 'content:index.md', extension: 'md', stem: 'index', meta: {}, body: stored } as unknown as DatabaseItem
}

const textOf = (node: MDCNode): string => node.type === 'text' ? node.value : node.type === 'element' ? (node.children || []).map(textOf).join('') : ''

// Tags, props and text of a page, ignoring whitespace and fence highlighting.
function outline(node: MDCNode): unknown {
  if (node.type === 'text') return node.value.replace(/\s+/g, ' ').trim()
  if (node.type !== 'element') return ''
  if (node.tag === 'pre') return ['pre', node.props?.language, textOf(node).trimEnd()]
  const props = Object.fromEntries(Object.entries(node.props || {}).sort(([a], [b]) => a.localeCompare(b)))
  return [node.tag, props, ...(node.children || []).map(outline).filter(Boolean)]
}

// How @nuxt/content reads a file.
async function renderedOutline(content: string): Promise<unknown[]> {
  const { body } = await parseWithMdc(content, { highlight: false, toc: false })
  return body.children.map(outline).filter(Boolean)
}

// What a file means: comark reads nested fences right, unlike @nuxtjs/mdc.
async function intendedOutline(content: string): Promise<unknown[]> {
  const tree = await parseWithComark(content, { autoClose: false, autoUnwrap: false })
  const body = decompressTree(markdownRootFromComarkTree(tree) as never) as MDCRoot
  return body.children.map(outline).filter(Boolean)
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

    // Trimmed from the Docus hero, where the second save split the description in two.
    describe('in a component slot read back by @nuxtjs/mdc', () => {
      const original = `::u-page-hero
#description
out of the box. :br Docus brings the best of the Nuxt ecosystem.
::
`

      it('keeps one paragraph with a hard break across saves', async () => {
        const first = await contentFromMarkdownDocument(await storedDocumentOf(original))
        const second = await contentFromMarkdownDocument(await storedDocumentOf(first!))

        expect(await renderedOutline(second!)).toEqual(await renderedOutline(original))
      })

      it('saves what comark reads from the file', async () => {
        for (const content of [original, await contentFromMarkdownDocument(await storedDocumentOf(original))]) {
          const fromStoredBody = await contentFromMarkdownDocument(await storedDocumentOf(content!))
          const fromComark = await contentFromMarkdownDocument(await documentFromMarkdownContent('content:index.md', content!))

          expect(fromStoredBody).toBe(fromComark)
        }
      })
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

  // Trimmed from the Docus landing, where a Studio save hid every card after the code sample.
  describe('nested MDC code sample read back by @nuxtjs/mdc', () => {
    const original = `::u-page-section
  :::u-page-grid
    ::::u-page-card
      :::::tabs
        ::::::tabs-item{label="Preview"}
          :::::::div
            ::::::::note
            Here's some additional information.
            ::::::::

            ::::::::caution
            This action cannot be undone.
            ::::::::
          :::::::
        ::::::

        ::::::tabs-item{label="Code"}
\`\`\`mdc
::note
Here's some additional information.
::

::caution
This action cannot be undone.
::
\`\`\`
        ::::::
      :::::

    #title
    Enhanced Markdown syntax
    ::::

    ::::u-page-card
    #title
    Built-in search
    ::::
  :::
::
`

    it('keeps the page structure after a save', async () => {
      const saved = await contentFromMarkdownDocument(await storedDocumentOf(original))

      expect(await renderedOutline(saved!)).toEqual(await intendedOutline(original))
    })

    it('writes the same file on a second save', async () => {
      const first = await contentFromMarkdownDocument(await storedDocumentOf(original))
      const second = await contentFromMarkdownDocument(await storedDocumentOf(first!))

      expect(second).toBe(first)
    })

    it('restores the page structure from a file broken by an earlier save', async () => {
      const saved = await contentFromMarkdownDocument(await storedDocumentOf(original))
      // Earlier saves wrote the same file, minus the padding of empty lines.
      const brokenByEarlierSave = saved!.replace(/^ +$/gm, '')
      expect(await renderedOutline(brokenByEarlierSave)).not.toEqual(await intendedOutline(original))

      const repaired = await contentFromMarkdownDocument(await storedDocumentOf(brokenByEarlierSave))

      expect(await renderedOutline(repaired!)).toEqual(await intendedOutline(original))
    })
  })

  // Trimmed from the Docus landing, which Studio reported as conflicted right after deploying it.
  describe('deployed body compared with the file it was built from', () => {
    const content = `::u-page-section
  :::u-page-grid
    ::::u-page-card
      :::::u-color-mode-image
      ---
      height: 320
      width: 859
      alt: Beautiful visual powered by UI
      ---
      :::::

    #title
    Powered by Nuxt UI
    ::::

    ::::u-page-card
    \`\`\`ts [app.config.ts]
    export default defineAppConfig({
      ui: {
        colors: {
          primary: 'green',
        },
      },
    })
    \`\`\`

    #title
    Customize with Nuxt App Config
    ::::
  :::
::
`

    it('matches its own file', async () => {
      expect(await isDocumentMatchingContent(content, await storedDocumentOf(content))).toBe(true)
    })

    it('still detects a changed code sample', async () => {
      const changed = content.replace(`primary: 'green'`, `primary: 'blue'`)

      expect(await isDocumentMatchingContent(changed, await storedDocumentOf(content))).toBe(false)
    })

    it('still detects re-indented code outside components', async () => {
      const file = '```ts\nconst a = {\n  b: 1,\n}\n```\n'
      const reindented = file.replace('  b: 1', '    b: 1')

      expect(await isDocumentMatchingContent(reindented, await storedDocumentOf(file))).toBe(false)
    })
  })

  // @nuxtjs/mdc kebab-cases the names of inline attributes, but keeps the keys of a YAML props block as written.
  describe('camelCase props read back by @nuxtjs/mdc', () => {
    const documentOf = (nodes: MarkdownDocument['nodes']) => ({
      id: 'content:index.md',
      extension: 'md',
      stem: 'index',
      meta: {},
      body: { nodes, frontmatter: {}, meta: {} },
    }) as unknown as DatabaseItem

    // The props form writes the camelCase names the component declares.
    const edited = documentOf([['my-card', { 'imageUrl': '/card.png', ':isOpen': 'true' }, 'Hello']])

    it('writes inline props in kebab-case', async () => {
      await expect(contentFromMarkdownDocument(edited)).resolves.toBe('::my-card{image-url="/card.png" is-open}\nHello\n::\n')
    })

    it('matches its own file once deployed', async () => {
      const saved = await contentFromMarkdownDocument(edited)

      expect(await isDocumentMatchingContent(saved!, await storedDocumentOf(saved!))).toBe(true)
    })

    it('writes the same file on a second save', async () => {
      const original = '::my-card\n---\nimageUrl: /card.png\n---\nHello\n::\n'

      const first = await contentFromMarkdownDocument(await storedDocumentOf(original))
      const second = await contentFromMarkdownDocument(await storedDocumentOf(first!))

      expect(second).toBe(first)
    })

    // Written by hand, or saved by earlier Studio versions.
    describe('file with camelCase inline props', () => {
      const content = '::my-card{imageUrl="/card.png"}\nHello\n::\n'

      it('matches its own deployed body', async () => {
        expect(await isDocumentMatchingContent(content, await storedDocumentOf(content))).toBe(true)
      })

      it('still detects a changed prop value', async () => {
        const changed = content.replace('/card.png', '/other.png')

        expect(await isDocumentMatchingContent(changed, await storedDocumentOf(content))).toBe(false)
      })
    })

    it('keeps the names of props written in a YAML block', async () => {
      const content = `::u-button
---
label: Get Started
size: lg
to: /introduction
trailingIcon: i-lucide-arrow-right
---
::
`

      await expect(contentFromMarkdownDocument(await storedDocumentOf(content))).resolves.toBe(content)
    })

    it('writes the props of inline components, spans and links in kebab-case', async () => {
      const document = documentOf([['p', {}, 'Hello ', ['my-badge', { badgeColor: 'red', size: 'sm', tone: 'warm', iconName: 'star' }], ' and ', ['span', { dataTone: 'warm' }, 'world'], ' ', ['a', { href: '/about', ariaLabel: 'About' }, 'about']]])

      await expect(contentFromMarkdownDocument(document)).resolves.toBe('Hello :my-badge{badge-color="red" size="sm" tone="warm" icon-name="star"} and [world]{data-tone="warm"} [about](/about){aria-label="About"}\n')
    })

    it('writes the children of a YAML block component in kebab-case', async () => {
      const document = documentOf([['my-list', { listItems: ['a', 'b'] }, ['my-item', { itemTitle: 'A' }, 'Item']]])

      await expect(contentFromMarkdownDocument(document)).resolves.toBe(`::my-list
---
listItems:
  - a
  - b
---
  :::my-item{item-title="A"}
  Item
  :::
::
`)
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
    it('upgrades a legacy body to a MarkdownDocument (adds .nodes)', async () => {
      const { legacy } = await legacyBodyOf('content:legacy.md', '# Hello\n')

      const upgraded = ensureComarkBody(legacy)

      expect(Array.isArray((upgraded.body as MarkdownDocument).nodes)).toBe(true)
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
