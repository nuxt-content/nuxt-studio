import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionFrontmatter from '../../../components/tiptap/extension/TiptapExtensionFrontmatter.vue'

export interface FrontmatterOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    Frontmatter: {
      handleFrontmatterBackspace: () => ReturnType
    }
  }
}

export const Frontmatter = Node.create<FrontmatterOptions>({
  name: 'frontmatter',
  priority: 1000,
  group: 'block',
  selectable: false,
  inline: false,
  isolating: true,

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

  addCommands() {
    return {
      handleFrontmatterBackspace: () => ({ state }) => {
        const { selection } = state
        if (!selection.empty) return false

        const { $from } = selection
        if ($from.parentOffset > 0 || $from.parent.type.spec.isolating) return false

        for (let depth = $from.depth - 1; depth >= 0; depth--) {
          if ($from.index(depth) > 0) {
            return $from.node(depth).child($from.index(depth) - 1).type.name === 'frontmatter'
          }
          if ($from.node(depth).type.spec.isolating) return false
        }
        return false
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Backspace': ({ editor }) => editor.commands.handleFrontmatterBackspace(),
      'Shift-Backspace': ({ editor }) => editor.commands.handleFrontmatterBackspace(),
      'Mod-Backspace': ({ editor }) => editor.commands.handleFrontmatterBackspace(),
      'Alt-Backspace': ({ editor }) => editor.commands.handleFrontmatterBackspace(),
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionFrontmatter)
  },
})
