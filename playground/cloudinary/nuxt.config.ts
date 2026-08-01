export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-studio',
  ],
  devtools: { enabled: true },
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
  compatibilityDate: '2025-08-26',
  studio: {
    route: '/admin',
    media: {
      external: true,
      provider: 'cloudinary',
      prefix: 'studio',
    },
    repository: {
      provider: 'github',
      owner: 'narr',
      repo: 'studio',
      branch: 'main',
      rootDir: 'playground/cloudinary',
      private: false,
    },
  },
})
