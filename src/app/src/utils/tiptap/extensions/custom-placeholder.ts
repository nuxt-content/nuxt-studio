import { Extension, isNodeEmpty } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface CustomPlaceholderOptions {
  placeholder: string
}

/**
 * Custom placeholder extension that hides when AI completion is visible
 * Overrides the default TipTap placeholder extension
 */
export const CustomPlaceholder = Extension.create<CustomPlaceholderOptions>({
  name: 'placeholder',

  addOptions() {
    return {
      placeholder: 'Write something …',
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder'),
        props: {
          decorations: ({ doc, selection }) => {
            // Only show when editable
            if (!this.editor.isEditable) {
              return null
            }

            // Check if AI completion is visible
            const aiCompletionStorage = this.editor.storage.aiCompletion
            if (aiCompletionStorage?.visible && aiCompletionStorage?.suggestion) {
              // Don't show placeholder when AI completion is visible
              return DecorationSet.empty
            }

            const { anchor } = selection
            const decorations: Decoration[] = []
            const isEmptyDoc = this.editor.isEmpty

            doc.descendants((node, pos) => {
              const hasAnchor = anchor >= pos && anchor <= pos + node.nodeSize
              const isEmpty = !node.isLeaf && isNodeEmpty(node)

              // Only show placeholder on current node with cursor
              if (hasAnchor && isEmpty) {
                const classes = ['is-empty']

                if (isEmptyDoc) {
                  classes.push('is-editor-empty')
                }

                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  'class': classes.join(' '),
                  'data-placeholder': this.options.placeholder,
                })

                decorations.push(decoration)
              }

              return false // Don't include children
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
