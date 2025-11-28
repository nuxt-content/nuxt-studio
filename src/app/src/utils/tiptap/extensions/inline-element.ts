import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import { textInputRule } from '../input-rules'
import TiptapExtensionInlineElement from '../../../components/tiptap/extension/TiptapExtensionInlineElement.vue'

export interface InlineElementOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    InlineElement: {
      /**
       * Toggle a InlineElement
       */
      setInlineElement: (tag: string) => ReturnType
    }
  }
}

export const InlineElement = Node.create<InlineElementOptions>({
  name: 'inline-element',
  group: 'inline',
  priority: 1000,
  inline: true,
  content: 'text*',

  addOptions() {
    return {
      tag: 'div',
      HTMLAttributes: {},
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
    return [{ tag: 'span[data-type="inline-element"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(HTMLAttributes, { 'data-type': 'inline-element' })
    mergedAttributes.props = JSON.stringify(mergedAttributes.props || {})
    return [
      'span',
      mergedAttributes,
      0,
    ]
  },

  addInputRules() {
    return [
      textInputRule({
        find: /(?:^|\s)(:([a-z-]+)(?:\[([^\]]*)\])?(?:\{[^}]*\})?)\s/i,
        type: this.type,
        getText: (match: string[]) => match[3],
        getAttributes: (match: string[]) => ({ tag: match[2] }),
      }),
    ]
  },

  addCommands() {
    return {
      setInlineElement: (tag: string) => ({ state, chain }) => {
        const {
          selection: { from },
        } = state

        return chain()
          .insertContentAt(from, {
            type: 'inline-element',
            attrs: { tag },
          })
          .run()
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionInlineElement)
  },
})
