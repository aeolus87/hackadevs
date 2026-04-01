export const PORTAL_STORAGE_KEY = 'hackadevs.portal'

export type PortalSession = {
  portalId: string
  portalSecret: string
}

export function readPortalSession(): PortalSession | null {
  try {
    const raw = localStorage.getItem(PORTAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PortalSession
    if (
      parsed &&
      typeof parsed.portalId === 'string' &&
      typeof parsed.portalSecret === 'string' &&
      parsed.portalId.length > 0 &&
      parsed.portalSecret.length > 0
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function writePortalSession(session: PortalSession): void {
  localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(session))
}

export function clearPortalSession(): void {
  localStorage.removeItem(PORTAL_STORAGE_KEY)
}

export function getPortalHeaders(): Record<string, string> {
  const s = readPortalSession()
  if (!s) return {}
  return {
    'X-Portal-Id': s.portalId,
    'X-Portal-Secret': s.portalSecret,
  }
}
