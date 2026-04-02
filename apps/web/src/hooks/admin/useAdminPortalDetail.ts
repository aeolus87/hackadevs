import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import type { AdminPortalRow } from '@/hooks/admin/useAdminPortals'

export type AdminPortalDetail = AdminPortalRow & {
  challenges: {
    id: string
    rawProblem: string
    status: string
    challenge: { title: string; slug: string } | null
  }[]
}

export function useAdminPortalDetail(portalId: string | null) {
  const [data, setData] = useState<AdminPortalDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!portalId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(ADMIN.PORTAL(portalId))
      setData(unwrapSuccessData<AdminPortalDetail>(res.data))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [portalId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
