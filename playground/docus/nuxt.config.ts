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
    ai: {
      apiKey: process.env.STUDIO_VERCEL_API_GATEWAY_KEY,
      context: {
        title: 'Nuxt Studio playground',
        description: 'Playground for Nuxt Studio similar to the official documentation.',
        style: 'technical documentation',
        tone: 'formal and professional',
      },
    },
  },
})
