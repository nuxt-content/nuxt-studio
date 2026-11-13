import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface ImageUploadOptions {
  /**
   * Uploads a pasted/dropped image file through Studio's media pipeline and resolves
   * to the path to reference it by (e.g. `/paste-xxxx.png`). When omitted, the
   * extension is inert and paste/drop fall back to the editor's default behavior
   * (this is the case in tests, where no media host is available).
   */
  uploadImage?: (file: File) => Promise<string | undefined>
}

function getImageFiles(fileList: FileList | undefined | null): File[] {
  if (!fileList?.length) {
    return []
  }
  return Array.from(fileList).filter(file => file.type.startsWith('image/'))
}

/**
 * Wires the editor's clipboard paste and file drop to Studio's media upload pipeline.
 *
 * Without this, pasting an image does nothing and dropping an image file just makes the
 * browser navigate to it. Here we intercept image files, push them through `uploadImage`
 * (backed by `useDraftMedias.upload`), and insert the editor's `image` node pointing at
 * the uploaded path. The service worker serves the draft media so the preview works
 * immediately, and the file is committed alongside the markdown on Publish.
 */
export const ImageUpload = Extension.create<ImageUploadOptions>({
  name: 'imageUpload',

  addOptions() {
    return {
      uploadImage: undefined,
    }
  },

  addProseMirrorPlugins() {
    const editor = this.editor
    const uploadImage = this.options.uploadImage

    // Inert when no upload handler is provided.
    if (!uploadImage) {
      return []
    }

    // Paste/drop handlers must return synchronously, so the upload + insert runs detached.
    async function insertImages(files: File[], pos?: number) {
      let insertAt = pos
      for (const file of files) {
        const src = await uploadImage!(file)
        if (!src) {
          continue
        }

        const node = { type: 'image', attrs: { props: { src } } }

        if (typeof insertAt === 'number') {
          editor.chain().focus().insertContentAt(insertAt, node).run()
          // Advance so multiple files don't stack on the same position.
          insertAt += 1
        }
        else {
          editor.chain().focus().insertContent(node).run()
        }
      }
    }

    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste(_view, event) {
            const files = getImageFiles(event.clipboardData?.files)
            if (!files.length) {
              return false
            }
            event.preventDefault()
            void insertImages(files)
            return true
          },
          handleDrop(view, event) {
            const files = getImageFiles(event.dataTransfer?.files)
            if (!files.length) {
              return false
            }
            event.preventDefault()
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
            void insertImages(files, coords?.pos)
            return true
          },
        },
      }),
    ]
  },
})
