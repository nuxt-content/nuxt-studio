import { describe, it, expect } from 'vitest'
import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.js'

import { applySlashCommandExclude, suggestionItemToExcludeKey } from '../../../../src/utils/tiptap/slashCommandFilter'

function label(text: string): EditorSuggestionMenuItem {
  return { type: 'label', label: text }
}

describe('suggestionItemToExcludeKey', () => {
  it('maps built-in kinds', () => {
    expect(suggestionItemToExcludeKey({ kind: 'paragraph' } as EditorSuggestionMenuItem)).toBe('paragraph')
    expect(suggestionItemToExcludeKey({ kind: 'heading', level: 2 } as EditorSuggestionMenuItem)).toBe('heading2')
    expect(suggestionItemToExcludeKey({ kind: 'mark', mark: 'bold' } as EditorSuggestionMenuItem)).toBe('bold')
    expect(suggestionItemToExcludeKey({ kind: 'horizontalRule' } as EditorSuggestionMenuItem)).toBe('horizontalRule')
  })

  it('returns null for labels', () => {
    expect(suggestionItemToExcludeKey(label('Style'))).toBeNull()
  })
})

describe('applySlashCommandExclude', () => {
  const style: EditorSuggestionMenuItem[] = [
    label('Style'),
    { kind: 'paragraph' } as EditorSuggestionMenuItem,
    { kind: 'heading', level: 1 } as EditorSuggestionMenuItem,
  ]

  const insert: EditorSuggestionMenuItem[] = [
    label('Insert'),
    { kind: 'image' } as EditorSuggestionMenuItem,
    { kind: 'video' } as EditorSuggestionMenuItem,
  ]

  it('returns both sections unchanged when exclude is empty', () => {
    const out = applySlashCommandExclude([style, insert], undefined)
    expect(out).toHaveLength(2)
    expect(out[0]).toEqual(style)
    expect(out[1]).toEqual(insert)
  })

  it('removes a full section with style or insert', () => {
    const out = applySlashCommandExclude([style, insert], ['style'])
    expect(out).toHaveLength(1)
    expect(out[0]?.[0]).toEqual(label('Insert'))
  })

  it('filters individual commands and drops empty sections', () => {
    const out = applySlashCommandExclude([style, insert], ['paragraph', 'image', 'insert'])
    expect(out).toHaveLength(1)
    expect(out[0]?.map(i => ('kind' in i ? i.kind : 'label'))).toEqual(['label', 'heading'])
  })

  it('omits a section when every command is excluded', () => {
    const narrow: EditorSuggestionMenuItem[] = [
      label('Style'),
      { kind: 'paragraph' } as EditorSuggestionMenuItem,
    ]
    const out = applySlashCommandExclude([narrow, insert], ['paragraph'])
    expect(out).toHaveLength(1)
    expect(out[0]?.[0]).toEqual(label('Insert'))
  })
})
