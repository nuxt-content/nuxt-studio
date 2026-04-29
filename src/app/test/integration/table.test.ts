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

    // GFM serializer pads columns to the longest cell value — use regex to match content regardless of padding
    expect(outputContent).toMatch(/\|\s*Name\s*\|\s*Role\s*\|/)
    expect(outputContent).toMatch(/\|\s*Alice\s*\|\s*Admin\s*\|/)
    expect(outputContent).toMatch(/\|\s*Bob\s*\|\s*User\s*\|/)
  })

  test('table with bold and link inside cells', async () => {
    const inputContent = `| Name | Link |
| --- | --- |
| **Alice** | [Profile](https://example.com) |`

    const document = await generateDocumentFromContent('test.md', inputContent, { compress: false }) as DatabasePageItem
    const tiptapJSON: JSONContent = await mdcToTiptap(document.body as never, {})

    const tableNode = tiptapJSON.content?.find(c => c.type === 'table')
    expect(tableNode).toBeDefined()

    const generatedMdcJSON = await tiptapToMDC(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: generatedMdcJSON.body as unknown as MarkdownRoot,
      ...generatedMdcJSON.data,
    })
    const outputContent = await generateContentFromDocument(generatedDocument)

    expect(outputContent).toContain('**Alice**')
    expect(outputContent).toContain('[Profile](https://example.com)')
  })

  test('table with empty cells', async () => {
    const inputContent = `| A | B |
| --- | --- |
|   | value |
| value |   |`

    const document = await generateDocumentFromContent('test.md', inputContent, { compress: false }) as DatabasePageItem
    const tiptapJSON: JSONContent = await mdcToTiptap(document.body as never, {})

    const tableNode = tiptapJSON.content?.find(c => c.type === 'table')
    expect(tableNode).toBeDefined()

    const dataRow1 = tableNode!.content![1]
    const emptyCell = dataRow1.content![0]
    expect(emptyCell.type).toBe('tableCell')
    expect(emptyCell.content).toEqual([{ type: 'paragraph', content: [] }])

    const generatedMdcJSON = await tiptapToMDC(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: generatedMdcJSON.body as unknown as MarkdownRoot,
      ...generatedMdcJSON.data,
    })
    const outputContent = await generateContentFromDocument(generatedDocument)

    expect(outputContent).toMatch(/\|\s*\|\s*value\s*\|/)
  })

  test('single-column table', async () => {
    const inputContent = `| Header |
| --- |
| One |
| Two |`

    const document = await generateDocumentFromContent('test.md', inputContent, { compress: false }) as DatabasePageItem
    const tiptapJSON: JSONContent = await mdcToTiptap(document.body as never, {})

    const tableNode = tiptapJSON.content?.find(c => c.type === 'table')
    expect(tableNode).toBeDefined()
    expect(tableNode?.content).toHaveLength(3)
    expect(tableNode?.content?.[0].content).toHaveLength(1)

    const generatedMdcJSON = await tiptapToMDC(tiptapJSON)
    const generatedDocument = createMockDocument('docs/test.md', {
      body: generatedMdcJSON.body as unknown as MarkdownRoot,
      ...generatedMdcJSON.data,
    })
    const outputContent = await generateContentFromDocument(generatedDocument)

    expect(outputContent).toMatch(/\|\s*Header\s*\|/)
    expect(outputContent).toMatch(/\|\s*One\s*\|/)
    expect(outputContent).toMatch(/\|\s*Two\s*\|/)
  })
})
