import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'

export function StaffRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthUser()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
    return <Navigate to="/feed" replace />
  }
  return <>{children}</>
}
