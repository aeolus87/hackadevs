import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { authPrimaryButtonClassName } from '@/components/auth-page-shell'
import { readPortalSession, clearPortalSession } from '@/lib/portal-storage'

function PendingApprovalScreen() {
  const signOut = () => {
    clearPortalSession()
    window.location.assign('/portal/register')
  }
  return (
    <div className="relative min-h-screen overflow-hidden bg-hd-page px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.12] via-transparent to-emerald-500/[0.06]" />
      <div className="relative mx-auto max-w-lg rounded-xl border border-hd-border border-l-4 border-l-amber-500 bg-hd-card p-6 shadow-hd-card">
        <h1 className="text-lg font-medium text-hd-text">Awaiting approval</h1>
        <p className="mt-2 text-sm text-hd-secondary">
          Your company portal registration is being reviewed. We&apos;ll email you within 48 hours.
        </p>
        <button type="button" onClick={signOut} className={`mt-6 ${authPrimaryButtonClassName}`}>
          Sign out
        </button>
      </div>
    </div>
  )
}

export function PortalSessionGate({ children }: { children: ReactNode }) {
  const session = readPortalSession()
  if (!session?.portalId || !session?.portalSecret) {
    return <Navigate to="/portal/register" replace />
  }
  if (session.isApproved === false) {
    return <PendingApprovalScreen />
  }
  return children
}
