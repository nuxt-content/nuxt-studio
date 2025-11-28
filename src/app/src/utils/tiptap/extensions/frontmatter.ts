import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionFrontmatter from '../../../components/tiptap/extension/TiptapExtensionFrontmatter.vue'

export interface FrontmatterOptions {
  HTMLAttributes: Record<string, unknown>
}

export const Frontmatter = Node.create<FrontmatterOptions>({
  name: 'frontmatter',
  priority: 1000,
  group: 'block',
  selectable: false,
  inline: false,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      frontmatter: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="Frontmatter"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'Frontmatter' }),
      0,
    ]
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionFrontmatter)
  },
})
