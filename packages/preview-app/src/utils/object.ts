export const omit = (obj: Record<string, unknown>, keys: string | string[]) => {
  return Object.fromEntries(Object.entries(obj)
    .filter(([key]) => !keys.includes(key)))
}
