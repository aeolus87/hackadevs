import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { AUTH } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useLogout() {
  const { clearSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await axiosInstance.post(AUTH.LOGOUT())
    } catch (e) {
      const { message } = parseAxiosError(e)
      setError(message)
    } finally {
      clearSession()
      setLoading(false)
      window.location.replace('/')
    }
  }, [clearSession])

  return { mutate, loading, error }
}
