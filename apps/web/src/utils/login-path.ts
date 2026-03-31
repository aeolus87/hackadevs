export function safeReturnTo(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  const t = raw.trim()
  if (t === '' || !t.startsWith('/') || t.startsWith('//')) return null
  if (t.includes('://')) return null
  return t
}

export function loginPath(returnTo?: string | null): string {
  const r = safeReturnTo(returnTo ?? null)
  if (!r) return '/login'
  return `/login?returnTo=${encodeURIComponent(r)}`
}

export type AuthReturnState = { returnTo?: string }
