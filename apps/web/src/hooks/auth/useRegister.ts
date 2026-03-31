import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { AUTH } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { AuthTokenResponse } from '@/types/hackadevs-api.types'
import { sessionUserFromAuthResponse } from '@/utils/session-user'
import { writeAuthState } from '@/lib/auth-storage'
import { safeReturnTo } from '@/utils/login-path'

export type RegisterPayload = {
  username: string
  email: string
  password: string
  displayName: string
  returnTo?: string | null
}

export function useRegister() {
  const { setSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.post<AuthTokenResponse>(AUTH.REGISTER(), payload)
        const token = res.data.accessToken ?? res.data.token
        if (!token) throw new Error('No token in response')
        const u = sessionUserFromAuthResponse(res.data.user)
        const rt = res.data.refreshToken ?? null
        writeAuthState({ token, user: u, refreshToken: rt })
        setSession(token, u, rt)
        const dest = safeReturnTo(payload.returnTo ?? null) ?? '/feed'
        window.location.replace(dest)
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setSession],
  )

  return { mutate, loading, error }
}
