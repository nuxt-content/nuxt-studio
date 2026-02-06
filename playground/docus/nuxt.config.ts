export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    '@nuxt/ui',
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
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'studio',
      branch: 'main',
      rootDir: 'playground/docus',
      private: false,
    },
    // OSS upload configuration (enable image paste/drop in TipTap editor)
    media: {
      enabled: true,
      endpoint: '/api/studio-upload',
      listEndpoint: '/api/studio-media',
      deleteEndpoint: '/api/studio-delete',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/*'],
    },
  },
})
