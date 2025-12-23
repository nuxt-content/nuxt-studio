import { Node, mergeAttributes, InputRule } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model'
import { TextSelection } from '@tiptap/pm/state'
import type { EditorState } from '@tiptap/pm/state'
// @ts-expect-error Strange ts check issue
import TiptapExtensionBinding from '../../../components/tiptap/extension/TiptapExtensionBinding.vue'

export interface BindingAttrs {
  value?: string | null
  defaultValue?: string | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    Binding: {
      /**
       * Insert a binding node
       */
      setBinding: (attrs: BindingAttrs) => ReturnType
      /**
       * Update the current binding node attributes
       */
      updateBinding: (attrs: BindingAttrs) => ReturnType
      /**
       * Remove current binding node
       */
      unsetBinding: () => ReturnType
    }
  }
}

const isValidAttr = (value?: string | null) => {
  if (!value) return false
  const trimmed = String(value).trim()
  if (!trimmed) return false
  const lower = trimmed.toLowerCase()
  return lower !== 'null' && lower !== 'undefined'
}

const sanitize = (attrs?: BindingAttrs) => {
  const cleaned: Record<string, string> = {}
  if (isValidAttr(attrs?.value)) cleaned.value = String(attrs!.value).trim()
  if (isValidAttr(attrs?.defaultValue)) cleaned.defaultValue = String(attrs!.defaultValue).trim()
  return cleaned
}

export const Binding = Node.create<BindingAttrs>({
  name: 'binding',
  inline: true,
  group: 'inline',
  content: 'text*',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: element => element.getAttribute('value'),
      },
      defaultValue: {
        default: null,
        parseHTML: element => element.getAttribute('default-value'),
      },
    }
  },

  addInputRules() {
    return [
      new InputRule({
        // eslint-disable-next-line regexp/no-super-linear-backtracking, regexp/optimal-quantifier-concatenation
        find: /\{\{\s*([^|\s}]+)\s*(?:\|\|\s*([^}]+)\s*)?\}\}$/,
        handler: ({ state, range, match }) => {
          const [, name, def] = match as RegExpMatchArray
          const attrs = sanitize({ value: name, defaultValue: def })
          const textValue = attrs.value || attrs.defaultValue
          const node = this.type.create(attrs, textValue ? state.schema.text(textValue) : undefined)

          let { tr } = state
          tr = tr.delete(range.from, range.to).insert(range.from, node)
          const posAfter = range.from + node.nodeSize
          const next = tr.doc.nodeAt(posAfter)
          if (!next || (next.isText && !(next.text || '').startsWith(' '))) {
            tr = tr.insertText(' ', posAfter)
          }

          tr.setSelection(TextSelection.create(tr.doc, posAfter + 1))
        },
      }),
    ]
  },

  parseHTML() {
    return [
      { tag: 'binding' },
      { tag: 'span[data-type="binding"]' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = { ...HTMLAttributes }
    if (!isValidAttr(attrs.value as string)) delete attrs.value
    if (!isValidAttr(attrs.defaultValue as string)) delete attrs.defaultValue
    return [
      'span',
      mergeAttributes({ 'data-type': 'binding' }, attrs),
    ]
  },

  addCommands() {
    const findCurrentBinding = (state: EditorState, type: NodeType) => {
      const { from, to } = state.selection
      let found: { pos: number, node: ProseMirrorNode } | null = null
      state.doc.nodesBetween(from, to, (node: ProseMirrorNode, pos: number) => {
        if (node.type === type) {
          found = { pos, node }
          return false
        }
        return undefined
      })
      return found
    }

    return {
      setBinding: attrs => ({ chain, state }) => {
        const cleaned = sanitize(attrs)
        const { from } = state.selection
        const textValue = cleaned.value || cleaned.defaultValue
        const content = textValue ? [state.schema.text(textValue)] : undefined
        const node = this.type.create(cleaned, content)
        let tr = state.tr.insert(from, node)

        const posAfter = from + node.nodeSize
        const nextNode = tr.doc.nodeAt(posAfter)
        const needsSpace = !nextNode || (nextNode.isText && !(nextNode.text || '').startsWith(' '))
        if (needsSpace) {
          tr = tr.insert(posAfter, state.schema.text(' '))
        }

        const targetPos = needsSpace ? posAfter + 1 : posAfter
        tr = tr.setSelection(TextSelection.create(tr.doc, targetPos))

        return chain().setMeta('preventAutofocus', true).command(({ dispatch }) => {
          if (dispatch) dispatch(tr)
          return true
        }).run()
      },
      updateBinding: attrs => ({ state, dispatch }) => {
        const cleaned = sanitize(attrs)
        const target = findCurrentBinding(state as EditorState, this.type)
        if (!target) return false
        const { pos, node } = target
        const tr = state.tr.setNodeMarkup(pos, undefined, { ...(node as ProseMirrorNode).attrs, ...cleaned })
        const start = Number(pos) + 1
        const end = Number(pos) + (node as ProseMirrorNode).nodeSize - 1
        tr.delete(start, end)
        const textValue = cleaned.value || cleaned.defaultValue
        if (textValue) {
          tr.insert(start, state.schema.text(textValue))
        }
        if (dispatch) dispatch(tr)
        return true
      },
      unsetBinding: () => ({ state, dispatch }) => {
        const target = findCurrentBinding(state as EditorState, this.type)
        if (!target) return false
        const { pos, node } = target
        const tr = state.tr.delete(Number(pos), Number(pos) + (node as ProseMirrorNode).nodeSize)
        if (dispatch) dispatch(tr)
        return true
      },
    }
  },

  addNodeView() {
    return VueNodeViewRenderer(TiptapExtensionBinding)
  },
})
