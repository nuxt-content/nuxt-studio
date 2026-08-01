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
    ai: {
      // GroqCloud free tier works in all regions (no credit card).
      // Set GROQ_API_KEY in .env. Alternatives: 'gateway' (NUXT_STUDIO_AI_API_KEY)
      // or 'gemini' (GEMINI_API_KEY, region-limited).
      provider: 'groq',
      groqModel: 'llama-3.3-70b-versatile',
      groqFastModel: 'llama-3.1-8b-instant',
    },
    media: {
      external: true,
      provider: 'cloudinary',
      prefix: 'studio',
    },
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'studio',
      branch: 'main',
      rootDir: 'playground/cloudinary',
      private: false,
    },
  },
})
