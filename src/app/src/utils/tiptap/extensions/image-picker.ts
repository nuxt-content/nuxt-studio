import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionImagePicker from '../../../components/tiptap/extension/TiptapExtensionImagePicker.vue'

declare module '@tiptap/vue-3' {
  interface Commands<ReturnType> {
    imagePicker: {
      insertImagePicker: () => ReturnType
    }
  }
}

export const ImagePicker = Node.create({
  name: 'image-picker',
  group: 'block',
  atom: true,
  addAttributes() {
    return {}
  },
  parseHTML() {
    return [{
      tag: 'div[data-type="image-picker"]',
    }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-picker' })]
  },
  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionImagePicker)
  },
  addCommands() {
    return {
      insertImagePicker: () => ({ commands }) => {
        return commands.insertContent({ type: this.name })
      },
    }
  },
})
