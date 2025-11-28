import { isEmpty, replaceNullWithEmptyString } from './object'
import yaml from 'js-yaml'

export const jsonToYaml = (data: Record<string, unknown>): string => {
  try {
    if (isEmpty(data)) {
      return ''
    }

    return yaml.dump(data, {
      noCompatMode: true,
      lineWidth: -1,
    })
  }
  catch {
    return ''
  }
}

export const yamlToJson = (data: string) => {
  const customSchema = yaml.DEFAULT_SCHEMA.extend({
    implicit: [
      new yaml.Type('tag:yaml.org,2002:timestamp', {
        kind: 'scalar',
        resolve: () => false,
        construct: data => data,
      }),
    ],
  })

  try {
    const json = yaml.load(data, { schema: customSchema }) as Record<string, unknown>
    // Check if json is an object
    return json && typeof json === 'object' ? replaceNullWithEmptyString(json) : null
  }
  catch {
    return null
  }
}
