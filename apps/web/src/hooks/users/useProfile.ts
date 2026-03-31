import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { DevUser } from '@/types/hackadevs-api.types'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export function useProfile(username: string) {
  const [data, setData] = useState<DevUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!username) {
      setData(null)
      setLoading(false)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(USERS.PROFILE(username))
      setData(unwrapSuccessData<DevUser>(res.data))
    } catch (e) {
      const { message, status } = parseAxiosError(e)
      setError(message)
      if (status === 404) setData(null)
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
