import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { loginPath } from '@/utils/login-path'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthUser()
  const location = useLocation()
  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={loginPath(returnTo)} replace />
  }
  return <>{children}</>
}
