export function decodeJwtPayload<T extends Record<string, unknown>>(jwt: string): T | null {
  try {
    const mid = jwt.split('.')[1]
    if (!mid) return null
    const b64 = mid.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
