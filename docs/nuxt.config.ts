export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['../src/module/src/module', '@nuxtjs/plausible'],
  css: ['~/assets/css/main.css'],

  llms: {
    domain: 'https://nuxt.studio',
    title: 'Nuxt Studio',
    description: 'Edit your Nuxt Content website in production.',
    full: {
      title: 'Nuxt Studio',
      description: 'Edit your Nuxt Content website in production.',
    },
  },
  studio: {
    dev: false,
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'nuxt-studio',
      rootDir: 'docs',
    },
    ai: {
      context: {
        title: 'Nuxt Studio',
        description: 'Edit your Nuxt Content website in production.',
        style: 'Technical documentation',
        tone: 'Formal and professional',
      },
    },
  },
})
