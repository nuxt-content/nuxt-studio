import { defineNuxtPlugin } from '#imports'
import { checkPreviewActivation } from '../utils/preview'

export default defineNuxtPlugin(async () => {
  checkPreviewActivation(async () => {
    if (typeof window !== 'undefined') {
      await import('preview-app')
      document.body.appendChild(document.createElement('preview-app'))
    }
  })
})
