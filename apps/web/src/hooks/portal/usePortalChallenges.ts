import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { PORTAL } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { getPortalHeaders } from '@/lib/portal-storage'
import type { PortalCompanyChallenge } from '@/types/portal.types'

export function usePortalChallenges() {
  const [data, setData] = useState<PortalCompanyChallenge[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<unknown>(PORTAL.CHALLENGES(), {
        headers: getPortalHeaders(),
      })
      setData(unwrapSuccessData<PortalCompanyChallenge[]>(res.data))
    } catch (e) {
      const { message } = parseAxiosError(e)
      setError(message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
