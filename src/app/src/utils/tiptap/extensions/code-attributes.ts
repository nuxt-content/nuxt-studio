import { Extension } from '@tiptap/core'

// Global attribute, not a `code` mark — UEditor already registers one we can't disable.
export const CodeAttributes = Extension.create({
  name: 'codeAttributes',

  addGlobalAttributes() {
    return [
      {
        types: ['code'],
        attributes: {
          language: { default: null },
        },
      },
    ]
  },
})
