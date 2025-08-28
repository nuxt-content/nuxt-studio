export default defineNuxtConfig({
  modules: [
    // '@nuxt/ui-pro',
    '../src/module',
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
