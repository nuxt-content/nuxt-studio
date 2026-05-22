import { describe, it, expect } from 'vitest'
import { contentFromMarkdownDocument, documentFromMarkdownContent } from '../../src/runtime/utils/document'

describe('Document - Markdown roundtrip Integration Tests', () => {
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
