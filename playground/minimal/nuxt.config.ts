export default defineNuxtConfig({
  modules: [
    'nuxt-studio',
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
  compatibilityDate: '2025-08-26',
})
