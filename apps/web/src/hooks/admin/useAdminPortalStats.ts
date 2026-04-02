import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'
import type { AdminPortalRow } from '@/hooks/admin/useAdminPortals'

export function useAdminPortalStats(enabled: boolean) {
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(ADMIN.PORTALS({ status: 'pending', page: 1, limit: 1 }))
      const norm = normalizePaginated<AdminPortalRow>(res.data, 1, 1)
      setPendingCount(norm.total)
    } catch (e) {
      setError(parseAxiosError(e).message)
      setPendingCount(0)
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { pendingCount, loading, error, refetch }
}
