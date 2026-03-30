import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { DevUser } from '@/types/hackadevs-api.types'

export function useMe() {
  const { token, setUser } = useAuth()
  const [data, setData] = useState<DevUser | null>(null)
  const [loading, setLoading] = useState(!!token)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!token) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<DevUser>(USERS.ME())
      setData(res.data)
      setUser(res.data)
    } catch (e) {
      setError(parseAxiosError(e).message)
    } finally {
      setLoading(false)
    }
  }, [token, setUser])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
