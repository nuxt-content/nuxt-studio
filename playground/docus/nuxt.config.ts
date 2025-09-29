export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    'nuxt-studio',
    '@nuxt/ui',
    '@nuxt/content',
  ],
  devtools: { enabled: true },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },

    preview: {
      dev: true,
      api: 'http://localhost:3000',
    },
  },
  contentStudio: {
    repository: {
      owner: 'nuxt-content',
      repo: 'studio',
      branch: 'edit-preview',
      rootDir: 'playground/docus',
    },
  },
  compatibilityDate: '2025-08-26',
})
