import type { StudioFeature } from './context'

export interface StudioConfig {
  syncEditorAndRoute: boolean
  showTechnicalMode: boolean
}

export interface StudioLocation {
  feature: StudioFeature
  itemId: string
}
