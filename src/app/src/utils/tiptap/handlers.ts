import type { Editor } from '@tiptap/vue-3'

type Handler = {
  canExecute: (editor: Editor) => boolean
  execute: (editor: Editor) => unknown
  isActive: (editor: Editor) => boolean
  isDisabled: undefined
}

export const CALLOUT_TYPES = new Set(['callout', 'note', 'tip', 'warning', 'caution'])

export function imageHandler(): Handler {
  return {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'image-picker' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'image-picker' }),
    isActive: (editor: Editor) => editor.isActive('image-picker'),
    isDisabled: undefined,
  }
}

export function videoHandler(): Handler {
  return {
    canExecute: (editor: Editor) => editor.can().insertContent({ type: 'video-picker' }),
    execute: (editor: Editor) => editor.chain().focus().insertContent({ type: 'video-picker' }),
    isActive: (editor: Editor) => editor.isActive('video-picker'),
    isDisabled: undefined,
  }
}

export function calloutHandler(kind: string): Handler {
  const calloutNode = {
    type: 'u-callout',
    attrs: { tag: kind, props: {} },
    content: [{ type: 'slot', attrs: { name: 'default' }, content: [{ type: 'paragraph', content: [] }] }],
  }
  return {
    canExecute: (editor: Editor) => editor.can().insertContent(calloutNode),
    execute: (editor: Editor) => editor.chain().focus().insertContent(calloutNode),
    isActive: (editor: Editor) => editor.isActive('u-callout', { tag: kind }),
    isDisabled: undefined,
  }
}

export function componentHandler(kind: string): Handler {
  return {
    canExecute: (editor: Editor) => editor.can().setElement(kind, 'default'),
    execute: (editor: Editor) => editor.chain().focus().setElement(kind, 'default'),
    isActive: (editor: Editor) => editor.isActive(kind),
    isDisabled: undefined,
  }
}
