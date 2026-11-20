import type { JSONContent } from '@tiptap/core'
import { describe, expect, it } from 'vitest'

import { addLastEmptyParagraph, getStandardSuggestionItems, removeLastEmptyParagraph } from '../../../../src/utils/tiptap/editor'
import { createEditor } from '../../../utils/editor'

const t = (key: string) => key

const paragraph: JSONContent = { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }
const component: JSONContent = {
  type: 'element',
  attrs: { tag: 'card', props: {} },
  content: [{ type: 'slot', attrs: { name: 'default', props: {} }, content: [paragraph] }],
}

function documentChangesOnFirstTransaction(json: JSONContent) {
  const editor = createEditor(json)
  // TipTap only registers its plugins when the editor is mounted, there is no DOM here so do it by hand.
  const mounted = editor.state.reconfigure({ plugins: editor.extensionManager.plugins })
  // The same kind of transaction a click on the drag handle dispatches, it changes nothing by itself.
  const { state } = mounted.applyTransaction(mounted.tr.setMeta('lockDragHandle', true))
  editor.destroy()

  return !state.doc.eq(mounted.doc)
}

function serializeSuggestionSections(exclude?: Parameters<typeof getStandardSuggestionItems>[1]) {
  return getStandardSuggestionItems(t, exclude).map(section =>
    section.map((item) => {
      if ('type' in item && item.type === 'label') {
        return item.label
      }

      if (item.kind === 'heading') {
        return `heading${item.level}`
      }

      if (item.kind === 'mark') {
        return item.mark
      }

      return item.kind
    }),
  )
}

describe('editor', () => {
  describe('addLastEmptyParagraph', () => {
    it('appends an empty paragraph after a last node that is not a paragraph', () => {
      const json = { type: 'doc', content: [paragraph, component] }

      expect(addLastEmptyParagraph(json)).toEqual({ type: 'doc', content: [paragraph, component, { type: 'paragraph' }] })
    })

    it('returns the document untouched when it already ends with a paragraph', () => {
      const json = { type: 'doc', content: [component, paragraph] }

      expect(addLastEmptyParagraph(json)).toBe(json)
    })

    it('does not mutate the document it is given', () => {
      const json = { type: 'doc', content: [component] }

      addLastEmptyParagraph(json)

      expect(json.content).toEqual([component])
    })

    it('is undone by removeLastEmptyParagraph', () => {
      const json = { type: 'doc', content: [paragraph, component] }

      expect(removeLastEmptyParagraph(addLastEmptyParagraph(json))).toEqual(json)
    })

    it('keeps the first transaction from changing a document that ends with a component', () => {
      const json = { type: 'doc', content: [paragraph, component] }

      // Loaded as is, TipTap appends its trailing paragraph on the first transaction.
      expect(documentChangesOnFirstTransaction(json)).toBe(true)
      expect(documentChangesOnFirstTransaction(addLastEmptyParagraph(json))).toBe(false)
    })
  })

  describe('getStandardSuggestionItems', () => {
    it('returns both built-in sections by default', () => {
      expect(serializeSuggestionSections()).toEqual([
        [
          'studio.tiptap.suggestion.style',
          'paragraph',
          'heading1',
          'heading2',
          'heading3',
          'heading4',
          'bulletList',
          'orderedList',
          'blockquote',
          'codeBlock',
          'bold',
          'italic',
          'strike',
          'code',
        ],
        [
          'studio.tiptap.suggestion.insert',
          'image',
          'video',
          'horizontalRule',
          'table',
        ],
      ])
    })

    it('removes a full section with style or insert', () => {
      expect(serializeSuggestionSections(['style'])).toEqual([
        [
          'studio.tiptap.suggestion.insert',
          'image',
          'video',
          'horizontalRule',
          'table',
        ],
      ])
    })

    it('filters individual commands and drops empty sections', () => {
      expect(serializeSuggestionSections(['paragraph', 'image', 'video', 'horizontalRule', 'table'])).toEqual([
        [
          'studio.tiptap.suggestion.style',
          'heading1',
          'heading2',
          'heading3',
          'heading4',
          'bulletList',
          'orderedList',
          'blockquote',
          'codeBlock',
          'bold',
          'italic',
          'strike',
          'code',
        ],
      ])
    })
  })
})
