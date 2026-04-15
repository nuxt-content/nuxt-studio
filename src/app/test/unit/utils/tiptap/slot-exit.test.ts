import type { JSONContent } from '@tiptap/core'
import { describe, test, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { TextSelection } from '@tiptap/pm/state'
import { Element } from '../../../../src/utils/tiptap/extensions/element'
import { Slot } from '../../../../src/utils/tiptap/extensions/slot'

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

    let emptyParagraphInnerPos = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' && node.content.size === 0) {
        emptyParagraphInnerPos = pos + 1
        return false
      }
    })
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, emptyParagraphInnerPos)),
    )

    const done = editor.commands.exitEmptyTextblockFromSlot()
    expect(done).toBe(true)

    const json = editor.getJSON()
    const element = json.content?.[0]
    expect(element?.type).toBe('element')
    const children = element?.content ?? []
    expect(children.length).toBe(2)
    expect(children[0]?.type).toBe('slot')
    expect(children[1]?.type).toBe('paragraph')
    const slotContent = children[0]?.content
    expect(slotContent?.length).toBe(1)
    expect(slotContent?.[0]?.content?.[0]?.text).toBe('hello')

    const { $from } = editor.state.selection
    expect($from.parent.type.name).toBe('paragraph')
    expect($from.parent.content.size).toBe(0)
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

    let emptyParagraphInnerPos = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' && node.content.size === 0) {
        emptyParagraphInnerPos = pos + 1
        return false
      }
    })
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, emptyParagraphInnerPos)),
    )

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

    let insideFirstParagraph = 0
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph' && node.textContent === 'a') {
        insideFirstParagraph = pos + 1
        return false
      }
    })
    editor.view.dispatch(
      editor.state.tr.setSelection(TextSelection.create(editor.state.doc, insideFirstParagraph)),
    )

    const done = editor.commands.exitEmptyTextblockFromSlot()
    expect(done).toBe(false)
  })
})
