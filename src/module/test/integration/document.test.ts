import { describe, it, expect } from 'vitest'
import { contentFromMarkdownDocument, documentFromMarkdownContent } from '../../src/runtime/utils/document'
import { ContentFileExtension } from '../../src/types/content'
import type { DatabaseItem } from 'nuxt-studio/app'

describe('Document - Markdown roundtrip Integration Tests', () => {
  describe('hard breaks', () => {
    it('serializes duplicated hard-break parser output as one markdown hard break', async () => {
      const document: DatabaseItem = {
        id: 'content:test.md',
        extension: ContentFileExtension.Markdown,
        stem: 'test',
        meta: {},
        body: {
          frontmatter: {},
          meta: {},
          nodes: [
            ['p', {}, 'Line one  \n', ['br', {}], '\nLine two'],
          ],
        },
      }

      await expect(contentFromMarkdownDocument(document)).resolves.toBe('Line one  \nLine two\n')
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
})
