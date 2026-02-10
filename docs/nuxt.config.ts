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
    route: '/admin',
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'studio',
      branch: 'main',
      rootDir: 'docs',
    },
  },
})
