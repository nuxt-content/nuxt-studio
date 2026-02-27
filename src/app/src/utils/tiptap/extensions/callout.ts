import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import type { Content } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionUCallout from '../../../components/tiptap/extension/TiptapExtensionUCallout.vue'

export type CalloutType = 'note' | 'tip' | 'warning' | 'caution'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: CalloutType) => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'u-callout',
  priority: 1001,
  group: 'block',
  content: 'block+',
  selectable: true,
  inline: false,

  addAttributes() {
    return {
      type: {
        default: 'note',
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
    return [{ tag: 'div[data-type="u-callout"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(HTMLAttributes, { 'data-type': 'u-callout' })
    mergedAttributes.props = JSON.stringify(mergedAttributes.props || {})
    return ['div', mergedAttributes, 0]
  },

  addInputRules() {
    const types: CalloutType[] = ['note', 'tip', 'warning', 'caution']
    return types.map(type =>
      new InputRule({
        find: new RegExp(`^::${type}\\s$`),
        handler: ({ range, chain }) => {
          const value: Content = {
            type: 'u-callout',
            attrs: { type, props: {} },
            content: [{ type: 'paragraph', content: [] }],
          }
          chain().deleteRange(range).insertContentAt(range.from, value).run()
        },
      }),
    )
  },

  addCommands() {
    return {
      setCallout: (type: CalloutType) => ({ state, chain }) => {
        const { selection: { from } } = state
        const value: Content = {
          type: 'u-callout',
          attrs: { type, props: {} },
          content: [{ type: 'paragraph', content: [] }],
        }
        return chain().insertContentAt(from, value).run()
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionUCallout)
  },
})
