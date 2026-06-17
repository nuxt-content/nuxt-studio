import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import type { Content } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionElement from '../../../components/tiptap/extension/TiptapExtensionElement.vue'

export interface ElementOptions {
  HTMLAttributes: Record<string, unknown>
  resolveInitialSlot: (tag: string) => string | undefined
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    Element: {
      setElement: (tag: string, slot?: string) => ReturnType
    }
  }
}

export const Element = Node.create<ElementOptions>({
  name: 'element',
  priority: 1000,
  group: 'block',
  content: 'block*',
  selectable: true,
  inline: false,

  addOptions() {
    return {
      tag: 'div',
      HTMLAttributes: {},
      resolveInitialSlot: () => 'default' as string | undefined,
    }
  },

  addAttributes() {
    return {
      tag: {
        default: 'div',
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
    return [{ tag: 'div[data-type="element"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(HTMLAttributes, { 'data-type': 'element' })
    mergedAttributes.props = JSON.stringify(mergedAttributes.props || {})
    return [
      'div',
      mergedAttributes,
      0,
    ]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^::([a-z-]+)\s$/i,
        handler: ({ range, match, chain }) => {
          const tag = match[1]!
          const slot = this.options.resolveInitialSlot(tag)
          const value: Content = {
            type: 'element',
            attrs: { tag },
          }
          if (slot) {
            value.content = [{
              type: 'slot',
              attrs: { name: slot },
              content: [{
                type: 'paragraph',
                content: [],
              }],
            }]
          }

          const command = chain().deleteRange(range).insertContentAt(range.from, value)
          if (!slot) {
            command.insertContentAt(range.from + 1, [{
              type: 'paragraph',
              content: [],
            }])
          }
          command.run()
        },
      }),
    ]
  },

  addCommands() {
    return {
      setElement: (tag: string, slot?: string) => ({ state, chain }) => {
        const {
          selection: { from },
        } = state

        const value: Content = {
          type: 'element',
          attrs: { tag },
        }
        if (slot) {
          value.content = [{
            type: 'slot',
            attrs: { name: slot },
            content: [{
              type: 'paragraph',
              content: [],
            }],
          }]
        }

        const command = chain().insertContentAt(from, value)
        if (!slot) {
          command.insertContentAt(from + 1, [{
            type: 'paragraph',
            content: [],
          }])
        }
        return command.run()
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionElement)
  },
})
