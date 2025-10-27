import type { StudioFeature } from './context'

export interface StudioConfig {
  syncEditorAndRoute: boolean
  showTechnicalMode: boolean
}

export interface StudioLocation {
  active: boolean
  feature: StudioFeature
  itemId: string
}
