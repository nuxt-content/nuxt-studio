import { createDefu } from 'defu'

/**
 * Custom defu merger that treats empty strings as undefined values
 */
const customDefu = createDefu((obj, key, value) => {
  if (obj[key] === '' && value !== undefined && value !== null && value !== '') {
    obj[key] = value
    return true
  }

  if (obj[key] !== undefined && obj[key] !== null) {
    return true
  }

  return false
})

export function mergeConfig<T>(config: T | undefined, defaults: Partial<T>): T {
  return customDefu(defaults, config || {}) as T
}
