export default defineNuxtConfig({
  modules: [
    // '@nuxt/ui-pro',
    'content-preview',
    '@nuxt/content',
  ],
  // css: ['~/assets/css/main.css'],
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
