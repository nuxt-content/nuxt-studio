export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['../src/module/src/module', '@nuxtjs/plausible'],
  css: ['~/assets/css/main.css'],
  studio: {
    repository: {
      provider: 'github',
      owner: 'nuxt-content',
      repo: 'studio',
      branch: 'main',
      rootDir: 'docs',
    },
  },
})
