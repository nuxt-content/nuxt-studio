import type { ComponentMeta } from '../../types/editor'

/**
 * Display name and description for a component slot in the Studio UI,
 * honoring `defineStudioMeta({ slots })` annotations.
 */
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
