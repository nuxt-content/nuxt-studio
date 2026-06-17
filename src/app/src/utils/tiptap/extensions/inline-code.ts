import Code from '@tiptap/extension-code'

// Base `Code` has no attrs, so `language` is lost on every round-trip.
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