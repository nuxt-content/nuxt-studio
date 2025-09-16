import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.js'

export enum StudioFeature {
  Content = 'content',
  Media = 'media',
  Config = 'config',
}

export interface StudioAction extends DropdownMenuItem {}
