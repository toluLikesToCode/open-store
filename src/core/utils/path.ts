export function getPath<T, V = any>(obj: T, path: (string | number)[]): V | undefined {
  let current: any = obj
  for (const key of path) {
    if (current === null || typeof current !== 'object') {
      return undefined
    }

    // Handle Map objects
    if (current instanceof Map) {
      // Try the key as-is first, then try converting string to number or vice versa
      if (current.has(key)) {
        current = current.get(key)
      } else if (typeof key === 'string' && !isNaN(Number(key))) {
        // Try converting string to number for Map access
        const numKey = Number(key)
        if (current.has(numKey)) {
          current = current.get(numKey)
        } else {
          return undefined
        }
      } else if (typeof key === 'number') {
        // Try converting number to string for Map access
        const strKey = String(key)
        if (current.has(strKey)) {
          current = current.get(strKey)
        } else {
          return undefined
        }
      } else {
        return undefined
      }
    } else {
      // Handle regular objects and arrays
      if (!(key in current)) {
        return undefined
      }
      current = current[key]
    }
  }
  return current as V
}

export function setPath<T extends object, V = any>(obj: T, path: (string | number)[], value: V): T {
  if (path.length === 0) {
    return value as any
  }

  // Handle Map objects at root level
  if (obj instanceof Map) {
    const newMap = new Map(obj)
    if (path.length === 1) {
      newMap.set(path[0], value)
      return newMap as T
    }
    // For nested paths in Maps, get the nested object and continue
    const key = path[0]
    const nestedObj = newMap.get(key)
    if (nestedObj && typeof nestedObj === 'object') {
      newMap.set(key, setPath(nestedObj, path.slice(1), value))
    }
    return newMap as T
  }

  const newObj = Array.isArray(obj) ? [...obj] : {...obj}
  let current: any = newObj

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    const nextKeyIsNumber = typeof path[i + 1] === 'number'

    // Handle Map objects in the path
    if (current instanceof Map) {
      if (!current.has(key)) {
        const newNestedMap = new Map(current)
        newNestedMap.set(key, nextKeyIsNumber ? [] : {})
        current = newNestedMap.get(key)
      } else {
        const existing = current.get(key)
        if (existing === null || typeof existing !== 'object') {
          const newNestedMap = new Map(current)
          newNestedMap.set(key, nextKeyIsNumber ? [] : {})
          current = newNestedMap.get(key)
        } else {
          current = Array.isArray(existing) ? [...existing] : {...existing}
        }
      }
    } else {
      // Existing logic for regular objects/arrays
      if (current[key] === null || typeof current[key] !== 'object') {
        current[key] = nextKeyIsNumber ? [] : {}
      } else {
        current[key] = Array.isArray(current[key]) ? [...current[key]] : {...current[key]}
      }
      current = current[key]
    }
  }

  current[path[path.length - 1]] = value
  return newObj as T
}
