import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { writeAuthState } from '@/lib/auth-storage'
import { decodeJwtPayload } from '@/lib/jwt-payload'
import { sessionUserFromAuthResponse } from '@/utils/session-user'
import { safeReturnTo } from '@/utils/login-path'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Signing in…')

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const token = q.get('token')
    const refresh = q.get('refresh')
    let next = safeReturnTo(q.get('returnTo'))
    if (!next) {
      try {
        const stored = localStorage.getItem('hackadevs.returnTo')
        localStorage.removeItem('hackadevs.returnTo')
        next = safeReturnTo(stored)
      } catch {
        next = null
      }
    }
    if (!token) {
      navigate(next ? `/login?returnTo=${encodeURIComponent(next)}` : '/login', { replace: true })
      return
    }
    const payload = decodeJwtPayload<{ sub: string; username: string }>(token)
    const u = sessionUserFromAuthResponse({
      id: payload?.sub ?? '',
      username: payload?.username ?? '',
      displayName: payload?.username ?? 'User',
    })
    writeAuthState({ token, user: u, refreshToken: refresh })
    setMessage('Loading profile…')
    window.location.replace(next != null ? next : '/feed')
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-hd-page px-4">
      <p className="text-sm text-hd-muted">{message}</p>
    </div>
  )
}
