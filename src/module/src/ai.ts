import { addServerHandler } from '@nuxt/kit'
import { resolve } from 'node:path'
import { readFile } from 'node:fs/promises'
import type { Nuxt } from '@nuxt/schema'
import type { ModuleOptions } from './module'

export async function setAIFeature(options: ModuleOptions, nuxt: Nuxt, runtime: (...args: string[]) => string): Promise<void> {
  if (!options.ai!.context?.title || !options.ai!.context?.description) {
    try {
      const pkgPath = resolve(nuxt.options.rootDir, 'package.json')
      const pkgContent = await readFile(pkgPath, 'utf-8')
      const pkg = JSON.parse(pkgContent)
      options.ai!.context!.title = options.ai!.context?.title || pkg.name
      options.ai!.context!.description = options.ai!.context?.description || pkg.description
    }
    catch { /* ignore errors reading package.json */ }
  }

  addServerHandler({
    method: 'post',
    route: '/__nuxt_studio/ai/generate',
    handler: runtime('./server/routes/ai/generate.post'),
  })

  // Only register analyze handler if experimental collectionContext is enabled
  if (options.ai?.experimental?.collectionContext) {
    addServerHandler({
      method: 'post',
      route: '/__nuxt_studio/ai/analyze',
      handler: runtime('./server/routes/ai/analyze.post'),
    })
  }
}
