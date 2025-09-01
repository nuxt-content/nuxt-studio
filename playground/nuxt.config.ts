export default defineNuxtConfig({
  modules: [
    // '@nuxt/ui-pro',
    'nuxt-studio',
    '@nuxt/content',
  ],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
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
