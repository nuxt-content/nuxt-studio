import { describe, expect, it } from 'vitest'

import { getStandardSuggestionItems } from '../../../../src/utils/tiptap/editor'

const t = (key: string) => key

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
        ],
      ])
    })

    it('filters individual commands and drops empty sections', () => {
      expect(serializeSuggestionSections(['paragraph', 'image', 'video', 'horizontalRule'])).toEqual([
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
