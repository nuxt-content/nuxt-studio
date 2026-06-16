import Code from '@tiptap/extension-code'

// Base Code has no attributes, so ProseMirror drops `language` on every round-trip.
// excludes: 'code' prevents self-nesting while still combining with bold/italic/etc.
export const InlineCode = Code.extend({
  excludes: 'code',

  addAttributes() {
    return {
      language: {
        default: null,
      },
    }
  },
})
