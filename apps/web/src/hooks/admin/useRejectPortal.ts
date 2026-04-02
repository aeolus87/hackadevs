import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { AdminPortalRow } from '@/hooks/admin/useAdminPortals'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export function useRejectPortal(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.patch(ADMIN.PORTAL_REJECT(id))
        const row = unwrapSuccessData<AdminPortalRow>(res.data)
        onSuccess?.()
        return row
      } catch (e) {
        const msg = parseAxiosError(e).message
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onSuccess],
  )

  return { mutate, loading, error }
}
