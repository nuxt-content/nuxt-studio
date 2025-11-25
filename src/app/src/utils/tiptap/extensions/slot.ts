import { Node, mergeAttributes } from '@tiptap/core'
import type { EditorView } from 'prosemirror-view'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
// import { Selection } from '@tiptap/pm/state'
// import { filteredWrappingInputRule } from '../../utils/inputRules/filteredWrappingInputRule'
// import { tiptapCurrentNode } from '../../utils/tiptap'
// import NodeView from './NodeView.vue'
import TiptapExtensionSlot from '../../../components/tiptap/extension/TiptapExtensionSlot.vue'

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

  extendNodeSchema() {
    return {
      disableDropCursor(editorView: EditorView, _pos: unknown, event: DragEvent) {
        if (editorView.dragging && editorView.dragging.slice) {
          const pos = editorView.posAtCoords({ left: event.clientX, top: event.clientY })
          const node = pos && pos.inside >= 0 && editorView.state.doc.nodeAt(pos.inside)

          const nodeType = node ? node?.type?.name || '' : ''
          const sliceType = editorView.dragging.slice.content.firstChild?.type.name
          // let parent: Node
          // editorView.state.doc.descendants((_node, _pos, _parent, _index) => {
          //   if (node === _node) {
          //     parent = _parent as unknown as Node
          //   }
          // })

          if (sliceType === 'slot' && nodeType === 'slot') {
            return true
          }
        }
      },
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

  addInputRules() {
    return [
      // `#foo` => node with name `foo`
      // This is a custom input rule that filters out the rule if the parent node is not an element
      // filteredWrappingInputRule({
      //   find: /^#([a-z]+)\s$/,
      //   parent: 'element',
      //   type: this.type,
      //   joinPredicate: (match, node) => match[1] === node.attrs.name,
      //   getAttributes: match => ({ name: match[1] }),
      // }),
    ]
  },

  addCommands() {
    return {
      // Copy from and update from https://github.com/ueberdosis/tiptap/blob/develop/packages/core/src/extensions/keymap.ts#L13
      handleSlotBackspace: () => ({ editor, commands }) => {
        // const node = tiptapCurrentNode(editor)
        // if (node?.type.name !== 'slot') {
        //   return false
        // }

        return false

        // return commands.first(({ commands }) => [
        //   () => commands.undoInputRule(),

        //   () => commands.command(({ tr }) => {
        //     const { selection, doc } = tr
        //     const { empty, $anchor } = selection
        //     const { pos, parent } = $anchor
        //     const $parentPos = $anchor.parent.isTextblock ? tr.doc.resolve(pos - 1) : $anchor
        //     const parentIsIsolating = $parentPos.parent.type.spec.isolating

        //     const parentPos = $anchor.pos - $anchor.parentOffset

        //     const isAtStart = (parentIsIsolating && $parentPos.parent.childCount === 1)
        //       ? parentPos === $anchor.pos
        //       : Selection.atStart(doc).from === pos

        //     if (!empty || !isAtStart || !parent.type.isTextblock || parent.textContent.length) {
        //       return false
        //     }

        //     // Do nothing, stay in slot text block
        //     return true
        //   }),
        //   () => commands.deleteSelection(),
        //   () => commands.joinBackward(),
        //   () => commands.selectNodeBackward(),
        // ])
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Shift-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Mod-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
      'Alt-Backspace': ({ editor }) => editor.commands.handleSlotBackspace(),
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionSlot)
  },
})
