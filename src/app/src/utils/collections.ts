import type { ParsedContentFile } from '@nuxt/content'
import { omit } from './object'

export function withoutReservedKeys(content: ParsedContentFile) {
  const result = omit(content, ['id', 'stem', 'extension', '__hash__', 'path', 'body', 'meta'])
  // Default value of navigation is true, so we can safely remove it
  if (result.navigation === true) {
    Reflect.deleteProperty(result, 'navigation')
  }

  if (content.seo) {
    const seo = content.seo as Record<string, unknown>
    if (seo.title === content.title) {
      Reflect.deleteProperty(result, 'seo')
    }
    if (seo.description === content.description) {
      Reflect.deleteProperty(result, 'seo')
    }
  }

  // expand meta to the root
  for (const key in (content.meta || {})) {
    if (key !== '__hash__') {
      result[key] = (content.meta as Record<string, unknown>)[key]
    }
  }
  return result
}
