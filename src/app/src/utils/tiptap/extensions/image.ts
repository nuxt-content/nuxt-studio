import type { CommandProps } from '@tiptap/core'
import { Node, mergeAttributes } from '@tiptap/core'
import type { SetImageOptions } from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionImage from '../../../components/tiptap/extension/TiptapExtensionImage.vue'
import { sanitizeImageUrl } from '../props'

export interface ImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
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

          // Sanitize URL
          const sanitizedSrc = sanitizeImageUrl(props.src)
          if (sanitizedSrc) attrs.src = sanitizedSrc

          // Other attributes
          if (props.alt) attrs.alt = String(props.alt)
          if (props.title) attrs.title = String(props.title)
          if (props.width) attrs.width = String(props.width)
          if (props.height) attrs.height = String(props.height)
          if (props.class) attrs.class = String(props.class)

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

    // Sanitize URL
    const sanitizedSrc = sanitizeImageUrl(props.src)
    if (sanitizedSrc) attrs.src = sanitizedSrc

    // Other attributes
    if (props.alt) attrs.alt = String(props.alt)
    if (props.title) attrs.title = String(props.title)
    if (props.width) attrs.width = String(props.width)
    if (props.height) attrs.height = String(props.height)
    if (props.class) attrs.class = String(props.class)

    return ['img', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionImage)
  },

  addCommands() {
    return {
      setImage: (options: SetImageOptions) => ({ commands }: CommandProps) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },
})
