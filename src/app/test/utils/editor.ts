import type { JSONContent } from '@tiptap/core'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Mention from '@tiptap/extension-mention'
import { studioStarterKitOptions, createStudioExtensions } from '../../src/utils/tiptap/studio-extensions'

// Mirrors UEditor's internal extension order so mark rank matches production.
// HorizontalRule and Mention are added explicitly because UEditor re-registers them
// after StarterKit (with horizontalRule: false) rather than using StarterKit's built-in.
const STUDIO_EDITOR_EXTENSIONS = [
  StarterKit.configure({
    ...studioStarterKitOptions,
    horizontalRule: false,
  }),
  HorizontalRule,
  Mention,
  ...createStudioExtensions(),
]

// Applies ProseMirror's mark rank-sort and dedup — the same pass the real editor runs.
export function roundTripThroughEditor(json: JSONContent): JSONContent {
  const editor = new Editor({
    extensions: STUDIO_EDITOR_EXTENSIONS,
    content: json,
  })
  const out = editor.getJSON()
  editor.destroy()
  return out
}
