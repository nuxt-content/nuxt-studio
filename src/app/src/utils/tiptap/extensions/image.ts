import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionImage from '../../../components/tiptap/extension/TiptapExtensionImage.vue'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /**
       * Set an image
       */
      setImage: (options: { src: string, alt?: string, title?: string, width?: string, height?: string, props?: Record<string, unknown> }) => ReturnType
      /**
       * Update image attributes
       */
      updateImage: (attrs: Record<string, unknown>) => ReturnType
    }
  }
}

export const Image = Node.create<ImageOptions>({
  name: 'image',

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    }
  },

  inline() {
    return this.options.inline
  },

  group() {
    return this.options.inline ? 'inline' : 'block'
  },

  draggable: true,

  addAttributes() {
    return {
      props: {
        default: {},
        parseHTML: (element) => {
          return {
            src: element.getAttribute('src') || '',
            alt: element.getAttribute('alt') || '',
            title: element.getAttribute('title') || '',
            width: element.getAttribute('width') || '',
            height: element.getAttribute('height') || '',
            class: element.getAttribute('class') || '',
          }
        },
        renderHTML: (attributes) => {
          const props = attributes.props || {}
          const attrs: Record<string, string> = {}

          if (props.src) attrs.src = props.src
          if (props.alt) attrs.alt = props.alt
          if (props.title) attrs.title = props.title
          if (props.width) attrs.width = props.width
          if (props.height) attrs.height = props.height
          if (props.class) attrs.class = props.class

          return attrs
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: this.options.allowBase64
          ? 'img[src]'
          : 'img[src]:not([src^="data:"])',
      },
    ]
  },

  renderHTML({ node }) {
    const props = node.attrs.props || {}
    const attrs: Record<string, string> = {}

    if (props.src) attrs.src = props.src
    if (props.alt) attrs.alt = props.alt
    if (props.title) attrs.title = props.title
    if (props.width) attrs.width = props.width
    if (props.height) attrs.height = props.height
    if (props.class) attrs.class = props.class

    return ['img', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionImage)
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
      updateImage: attrs => ({ state, tr, dispatch }) => {
        const { selection } = state
        const node = state.doc.nodeAt(selection.from)

        if (node?.type.name === this.name) {
          if (dispatch) {
            tr.setNodeMarkup(selection.from, undefined, {
              ...node.attrs,
              ...attrs,
            })
          }
          return true
        }

        return false
      },
    }
  },
})
