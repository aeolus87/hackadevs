import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { readPortalSession } from '@/lib/portal-storage'

export function PortalSessionGate({ children }: { children: ReactNode }) {
  const session = readPortalSession()
  if (!session?.portalId || !session?.portalSecret) {
    return <Navigate to="/portal/register" replace />
  }
  return children
}
