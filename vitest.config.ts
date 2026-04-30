import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      // Resolve self-referential package imports to source when dist is not built
      'nuxt-studio/app/utils': path.resolve(__dirname, 'src/app/src/shared.ts'),
      'nuxt-studio/app': path.resolve(__dirname, 'src/app/src/main.ts'),
    },
  },
  plugins: [vue()],
  test: {
    setupFiles: ['./src/app/test/setup.ts'],
  },
})
