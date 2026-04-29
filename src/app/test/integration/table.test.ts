import { test, describe, expect } from 'vitest'
import { tiptapToMDC } from '../../src/utils/tiptap/tiptapToMdc'
import { generateContentFromDocument, generateDocumentFromContent } from '../../../module/dist/runtime/utils/document'
import type { JSONContent } from '@tiptap/core'
import { mdcToTiptap } from '../../src/utils/tiptap/mdcToTiptap'
import type { DatabasePageItem } from '../../src/types'
import type { MarkdownRoot } from '@nuxt/content'
import { createMockDocument } from '../mocks/document'

describe('table', () => {
  test('simple table with header row', async () => {
    const inputContent = `| Name | Role |
| --- | --- |
| Alice | Admin |
| Bob | User |`

    const document = await generateDocumentFromContent('test.md', inputContent, { compress: false }) as DatabasePageItem

    const tiptapJSON: JSONContent = await mdcToTiptap(document.body as never, {})

    const tableNode = tiptapJSON.content?.find(c => c.type === 'table')
    expect(tableNode).toBeDefined()
    expect(tableNode?.content).toHaveLength(3)

    const headerRow = tableNode!.content![0]
    expect(headerRow.type).toBe('tableRow')
    expect(headerRow.content?.[0]?.type).toBe('tableHeader')
    expect(headerRow.content?.[1]?.type).toBe('tableHeader')

    const firstDataRow = tableNode!.content![1]
    expect(firstDataRow.type).toBe('tableRow')
    expect(firstDataRow.content?.[0]?.type).toBe('tableCell')

    const generatedMdcJSON = await tiptapToMDC(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: generatedMdcJSON.body as unknown as MarkdownRoot,
      ...generatedMdcJSON.data,
    })
    const outputContent = await generateContentFromDocument(generatedDocument)

    expect(outputContent).toContain('| Name | Role |')
    expect(outputContent).toContain('| Alice | Admin |')
    expect(outputContent).toContain('| Bob | User |')
  })
})
