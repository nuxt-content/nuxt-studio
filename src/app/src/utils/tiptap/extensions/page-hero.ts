import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import type { Content } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionUPageHero from '../../../components/tiptap/extension/TiptapExtensionUPageHero.vue'

export interface UPageHeroOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    UPageHero: {
      setUPageHero: () => ReturnType
    }
  }
}

export const UPageHero = Node.create<UPageHeroOptions>({
  name: 'u-page-hero',
  priority: 1000,
  group: 'block',
  content: 'slot+',
  selectable: true,
  inline: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      props: {
        parseHTML(element) {
          return JSON.parse(element.getAttribute('props') || '{}')
        },
        default: {},
      },
      editingSlot: {
        default: null,
        rendered: false,
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="u-page-hero"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const mergedAttributes = mergeAttributes(HTMLAttributes, { 'data-type': 'u-page-hero' })
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
        find: /^::u-page-hero\s$/i,
        handler: ({ range, chain }) => {
          const value: Content = {
            type: 'u-page-hero',
            attrs: { props: {} },
            content: [
              {
                type: 'slot',
                attrs: { name: 'headline' },
                content: [{ type: 'paragraph', content: [] }],
              },
              {
                type: 'slot',
                attrs: { name: 'title' },
                content: [{ type: 'paragraph', content: [] }],
              },
              {
                type: 'slot',
                attrs: { name: 'description' },
                content: [{ type: 'paragraph', content: [] }],
              },
              {
                type: 'slot',
                attrs: { name: 'links' },
                content: [{ type: 'paragraph', content: [] }],
              },
            ],
          }

          chain()
            .deleteRange(range)
            .insertContentAt(range.from, value)
            .run()
        },
      }),
    ]
  },

  addCommands() {
    return {
      setUPageHero: () => ({ state, chain }) => {
        const {
          selection: { from },
        } = state

        const value: Content = {
          type: 'u-page-hero',
          attrs: { props: {} },
          content: [
            {
              type: 'slot',
              attrs: { name: 'headline' },
              content: [{ type: 'paragraph', content: [] }],
            },
            {
              type: 'slot',
              attrs: { name: 'title' },
              content: [{ type: 'paragraph', content: [] }],
            },
            {
              type: 'slot',
              attrs: { name: 'description' },
              content: [{ type: 'paragraph', content: [] }],
            },
            {
              type: 'slot',
              attrs: { name: 'links' },
              content: [{ type: 'paragraph', content: [] }],
            },
          ],
        }

        return chain()
          .insertContentAt(from, value)
          .run()
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionUPageHero)
  },
})
