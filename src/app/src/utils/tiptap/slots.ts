import type { ComponentMeta } from '../../types/editor'

export function getSlotDisplay(componentMeta: ComponentMeta | undefined, slotName: string): { label: string, description?: string } {
  const slotMeta = componentMeta?.meta.studio?.slots?.[slotName]

  const display: { label: string, description?: string } = {
    label: slotMeta?.label ?? slotName,
  }
  if (slotMeta?.description !== undefined) {
    display.description = slotMeta.description
  }

  return display
}
