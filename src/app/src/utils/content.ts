import type { ParsedContentFile } from '@nuxt/content'
import { stringifyMarkdown } from '@nuxtjs/mdc/runtime'
import type { MDCRoot } from '@nuxtjs/mdc'
import { withoutReservedKeys } from './collections'

export async function generateMarkdown(record: ParsedContentFile) {
  const markdown = await stringifyMarkdown(record.body as MDCRoot, withoutReservedKeys(record))
  return markdown
}
