import { toRaw } from 'vue'

export default function jsonStringifyReactiveValue(obj, spaces) {
  if (obj == null) {
    return null
  }

  const rawObj = toRaw(obj)

  const seen = new WeakSet()
  return JSON.stringify(
    rawObj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined
        seen.add(value)
      }
      return value
    },
    spaces
  )
}
