import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TiptapExtensionVideo from '../../../components/tiptap/extension/TiptapExtensionVideo.vue'
import { sanitizeMediaUrl } from '../props'

export interface VideoOptions {
  inline: boolean
  HTMLAttributes: Record<string, unknown>
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  addOptions() {
    return {
      inline: false,
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
            poster: element.getAttribute('poster') || '',
            width: element.getAttribute('width') || '',
            height: element.getAttribute('height') || '',
            class: element.getAttribute('class') || '',
            controls: element.hasAttribute('controls'),
            autoplay: element.hasAttribute('autoplay'),
            loop: element.hasAttribute('loop'),
            muted: element.hasAttribute('muted'),
          }
        },
        renderHTML: (attributes) => {
          const props = attributes.props || {}
          const attrs: Record<string, string | boolean> = {}

          // Sanitize URL
          const sanitizedSrc = sanitizeMediaUrl(props.src, 'video')
          if (sanitizedSrc) attrs.src = sanitizedSrc

          // Sanitize poster URL (poster is an image)
          if (props.poster) {
            const sanitizedPoster = sanitizeMediaUrl(props.poster, 'image')
            if (sanitizedPoster) attrs.poster = sanitizedPoster
          }

          // Other attributes
          if (props.width) attrs.width = String(props.width)
          if (props.height) attrs.height = String(props.height)
          if (props.class) attrs.class = String(props.class)

          // Boolean attributes
          if (props.controls) attrs.controls = true
          if (props.autoplay) attrs.autoplay = true
          if (props.loop) attrs.loop = true
          if (props.muted) attrs.muted = true

          return attrs
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[src]',
      },
    ]
  },

  renderHTML({ node }) {
    const props = node.attrs.props || {}
    const attrs: Record<string, string | boolean> = {}

    // Sanitize URL
    const sanitizedSrc = sanitizeMediaUrl(props.src, 'video')
    if (sanitizedSrc) attrs.src = sanitizedSrc

    // Sanitize poster URL (poster is an image)
    if (props.poster) {
      const sanitizedPoster = sanitizeMediaUrl(props.poster, 'image')
      if (sanitizedPoster) attrs.poster = sanitizedPoster
    }

    // Other attributes
    if (props.width) attrs.width = String(props.width)
    if (props.height) attrs.height = String(props.height)
    if (props.class) attrs.class = String(props.class)

    // Boolean attributes
    if (props.controls) attrs.controls = true
    if (props.autoplay) attrs.autoplay = true
    if (props.loop) attrs.loop = true
    if (props.muted) attrs.muted = true

    return ['video', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionVideo)
  },
})
