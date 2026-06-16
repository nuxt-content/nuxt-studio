import type { JSONContent } from '@tiptap/core'
import { describe, test, expect, afterEach } from 'vitest'
import type { Editor } from '@tiptap/core'
import { Fragment, Slice } from '@tiptap/pm/model'
import { createEditor } from '../../../../utils/editor'
import { dropWouldLandInElement } from '../../../../../src/utils/tiptap/extensions/slot-drop-guard'

function posInside(editor: Editor, text: string): number {
  let pos = -1
  editor.state.doc.descendants((node, nodePos) => {
    if (pos === -1 && node.isTextblock && node.textContent === text) {
      pos = nodePos + 1
      return false
    }
  })
  return pos
}

function paragraphSlice(editor: Editor): Slice {
  const paragraph = editor.schema.nodes.paragraph.create(null, editor.schema.text('dropped'))
  return new Slice(Fragment.from(paragraph), 0, 0)
}

describe('slot-drop-guard › dropWouldLandInElement', () => {
  let editor: Editor | undefined

  afterEach(() => {
    editor?.destroy()
    editor = undefined
  })

  // doc
  // ├─ element (card)
  // │  ├─ slot (default) → paragraph "in-slot"
  // │  └─ paragraph "loose-in-element"   (direct child of the element, like exit-slot leaves)
  // └─ paragraph "top-level"
  function buildEditor() {
    const json: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'element',
          attrs: { tag: 'card', props: {} },
          content: [
            {
              type: 'slot',
              attrs: { name: 'default', props: {} },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'in-slot' }] }],
            },
            { type: 'paragraph', content: [{ type: 'text', text: 'loose-in-element' }] },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'top-level' }] },
      ],
    }
    return createEditor(json)
  }

  test('cancels a drop that lands directly inside a component element', () => {
    editor = buildEditor()
    const pos = posInside(editor, 'loose-in-element')
    expect(dropWouldLandInElement(editor.state.doc, pos, paragraphSlice(editor))).toBe(true)
  })

  test('allows a drop inside a slot', () => {
    editor = buildEditor()
    const pos = posInside(editor, 'in-slot')
    expect(dropWouldLandInElement(editor.state.doc, pos, paragraphSlice(editor))).toBe(false)
  })

  test('allows a drop at the document level', () => {
    editor = buildEditor()
    const pos = posInside(editor, 'top-level')
    expect(dropWouldLandInElement(editor.state.doc, pos, paragraphSlice(editor))).toBe(false)
  })

  test('ignores an empty slice', () => {
    editor = buildEditor()
    const pos = posInside(editor, 'loose-in-element')
    expect(dropWouldLandInElement(editor.state.doc, pos, Slice.empty)).toBe(false)
  })
})
