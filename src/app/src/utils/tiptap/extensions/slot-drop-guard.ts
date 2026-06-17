import { Extension } from '@tiptap/core'
import type { Node as PMNode, Slice } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { dropPoint } from '@tiptap/pm/transform'

// `element` accepts `block*`, so drops can bypass slots and land directly inside the component.
export function dropWouldLandInElement(doc: PMNode, coordPos: number, slice: Slice): boolean {
  if (!slice.content.size) {
    return false
  }
  const $pos = doc.resolve(dropPoint(doc, coordPos, slice) ?? coordPos)
  return $pos.parent.type.name === 'element'
}

export const SlotDropGuard = Extension.create({
  name: 'slotDropGuard',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('slotDropGuard'),
        props: {
          handleDrop(view, event, slice) {
            const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
            return coords ? dropWouldLandInElement(view.state.doc, coords.pos, slice) : false
          },
        },
      }),
    ]
  },
})
