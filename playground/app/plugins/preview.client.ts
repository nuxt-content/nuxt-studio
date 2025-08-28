import { defineNuxtPlugin, queryCollection, queryCollectionItemSurroundings, queryCollectionNavigation, queryCollectionSearchSections } from '#imports'

export default defineNuxtPlugin(async (nuxtApp) => {
  // Will be handled by the @nuxt/content module
  nuxtApp.provide('content', {
    queryCollection,
    queryCollectionItemSurroundings,
    queryCollectionNavigation,
    queryCollectionSearchSections,
    collections: await import('#content/preview').then(m => m.collections),
  })
})
