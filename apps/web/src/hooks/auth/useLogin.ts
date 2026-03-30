import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { AUTH } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { AuthTokenResponse } from '@/types/hackadevs-api.types'
import { sessionUserFromAuthResponse } from '@/utils/session-user'

export type LoginPayload = { email: string; password: string }

export function useLogin() {
  const { setSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.post<AuthTokenResponse>(AUTH.LOGIN(), payload)
        const token = res.data.accessToken ?? res.data.token
        if (!token) throw new Error('No token in response')
        const u = sessionUserFromAuthResponse(res.data.user)
        setSession(token, u)
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
