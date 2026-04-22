import type { JSONContent } from '@tiptap/core'
import { describe, test, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TextSelection } from '@tiptap/pm/state'
import type { Node } from '@tiptap/pm/model'
import { Element } from '../../../../../src/utils/tiptap/extensions/element'
import { Slot } from '../../../../../src/utils/tiptap/extensions/slot'

function createEditor(json: JSONContent) {
  return new Editor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Element,
      Slot,
    ],
    content: json,
  })
}

function placeCaretAt(editor: Editor, predicate: (node: Node) => boolean) {
  let pos = 0
  editor.state.doc.descendants((node, nodePos) => {
    if (predicate(node)) {
      pos = nodePos + 1
      return false
    }
  })
  editor.view.dispatch(
    editor.state.tr.setSelection(TextSelection.create(editor.state.doc, pos)),
  )
}

describe('slot', () => {
  describe('exitEmptyTextblockFromSlot', () => {
    let editor: Editor | undefined

    afterEach(() => {
      editor?.destroy()
      editor = undefined
    })

    test('moves empty paragraph after slot when slot has another block', () => {
      editor = createEditor({
        type: 'doc',
        content: [
          {
            type: 'element',
            attrs: { tag: 'card', props: {} },
            content: [
              {
                type: 'slot',
                attrs: { name: 'default', props: {} },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'hello' }],
                  },
                  {
                    type: 'paragraph',
                  },
                ],
              },
            ],
          },
        ],
      })

      placeCaretAt(editor, node => node.type.name === 'paragraph' && node.childCount === 0)

      const done = editor.commands.exitEmptyTextblockFromSlot()
      expect(done).toBe(true)

      const json = editor.getJSON()
      const element = json.content?.[0]
      expect(element?.type).toBe('element')
      const children = element?.content ?? []
      expect(children.length).toBe(2)
      expect(children[0]?.type).toBe('slot')
      expect(children[1]?.type).toBe('paragraph')
      const slotContent = children[0]?.content ?? []
      expect(slotContent.length).toBe(1)
      expect(slotContent[0]?.content?.[0]?.text).toBe('hello')

      const { $from } = editor.state.selection
      expect($from.parent.type.name).toBe('paragraph')
      expect($from.parent.childCount).toBe(0)
    })

    test('returns false when slot only has one empty paragraph', () => {
      editor = createEditor({
        type: 'doc',
        content: [
          {
            type: 'element',
            attrs: { tag: 'card', props: {} },
            content: [
              {
                type: 'slot',
                attrs: { name: 'default', props: {} },
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              },
            ],
          },
        ],
      })

      placeCaretAt(editor, node => node.type.name === 'paragraph' && node.childCount === 0)

      const done = editor.commands.exitEmptyTextblockFromSlot()
      expect(done).toBe(false)
    })

    test('returns false when paragraph is not empty', () => {
      editor = createEditor({
        type: 'doc',
        content: [
          {
            type: 'element',
            attrs: { tag: 'card', props: {} },
            content: [
              {
                type: 'slot',
                attrs: { name: 'default', props: {} },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'a' }],
                  },
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'b' }],
                  },
                ],
              },
            ],
          },
        ],
      })

      placeCaretAt(editor, node => node.type.name === 'paragraph' && node.textContent === 'a')

      const done = editor.commands.exitEmptyTextblockFromSlot()
      expect(done).toBe(false)
    })
  })
})
