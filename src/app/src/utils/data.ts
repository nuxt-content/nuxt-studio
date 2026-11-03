import { isEmpty, replaceNullWithEmptyString } from './object'
import { CORE_SCHEMA, dump, load, mergeTag, timestampTag } from 'js-yaml'

export const jsonToYaml = (data: Record<string, unknown>): string => {
  try {
    if (isEmpty(data)) {
      return ''
    }

    // Timestamp tag keeps date-like strings quoted, as js-yaml v4 did.
    return dump(data, {
      schema: CORE_SCHEMA.withTags(timestampTag, mergeTag),
      lineWidth: -1,
    })
  }
  catch {
    return ''
  }
}

export const yamlToJson = (data: string) => {
  try {
    // No timestamp tag so dates stay strings.
    const json = load(data, { schema: CORE_SCHEMA.withTags(mergeTag) }) as Record<string, unknown>
    // Check if json is an object
    return json && typeof json === 'object' ? replaceNullWithEmptyString(json) : null
  }
  catch {
    return null
  }
}
