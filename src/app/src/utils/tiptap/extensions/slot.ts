import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewRendererProps } from '@tiptap/core'
import { TextSelection } from '@tiptap/pm/state'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionSlot from '../../../components/tiptap/extension/TiptapExtensionSlot.vue'
import TiptapExtensionUniqueDefaultSlot from '../../../components/tiptap/extension/TiptapExtensionUniqueDefaultSlot.vue'

export interface ElementOptions {
  HTMLAttributes: Record<string, unknown>
  nestable: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    Slot: {
      /**
       * Override backspace command
       */
      handleSlotBackspace: () => ReturnType
      /**
       * Move empty trailing block out of slot on double-Enter.
       */
      exitEmptyTextblockFromSlot: () => ReturnType
    }
  }
}

export const Slot = Node.create<ElementOptions>({
  name: 'slot',
  priority: 1000,
  group: 'block',
  content: 'block+',
  selectable: false,
  inline: false,
  isolating: true,

  addOptions() {
    return {
      tag: 'div',
      nestable: false,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      name: {
        default: 'default',
      },
      props: {
        parseHTML(element) {
          return JSON.parse(element.getAttribute('props') || '{}')
        },
        default: {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="Slot"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'Slot' }),
      0,
    ]
  },

  addCommands() {
    return {
      handleSlotBackspace: () => () => {
        return false
      },
      exitEmptyTextblockFromSlot:
        () =>
          ({ state, dispatch }) => {
            const { selection } = state
            if (!selection.empty) {
              return false
            }

            const $from = selection.$from
            const parent = $from.parent
            if (!parent.isTextblock || parent.content.size > 0) {
              return false
            }

            if (parent.type.name !== 'paragraph' && parent.type.name !== 'heading') {
              return false
            }

            if ($from.depth < 2) {
              return false
            }

            const slotDepth = $from.depth - 1
            if ($from.node(slotDepth).type.name !== 'slot') {
              return false
            }

            const slot = $from.node(slotDepth)
            if (slot.childCount <= 1) {
              return false
            }

            const paraStart = $from.before($from.depth)
            const paraEnd = $from.after($from.depth)
            const afterSlot = $from.after(slotDepth)

            const tr = state.tr.delete(paraStart, paraEnd)
            const insertPos = tr.mapping.map(afterSlot)
            tr.insert(insertPos, parent.copy())
            const innerPos = insertPos + 1
            tr.setSelection(TextSelection.create(tr.doc, innerPos))

            dispatch?.(tr.scrollIntoView())
            return true
          },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Enter': ({ editor }) => editor.commands.exitEmptyTextblockFromSlot(),
      'Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Shift-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Mod-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Alt-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
    }
  },

  addNodeView() {
    return (props: NodeViewRendererProps) => {
      const pos = props.getPos()
      if (typeof pos === 'number') {
        const $pos = props.editor.state.doc.resolve(pos)
        if ($pos.parent?.type.name === 'u-callout') {
          return VueNodeViewRenderer(TiptapExtensionUniqueDefaultSlot)(props)
        }
      }
      return VueNodeViewRenderer(TiptapExtensionSlot)(props)
    }
  },
})
