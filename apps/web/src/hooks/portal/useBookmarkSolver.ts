import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { PORTAL } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { getPortalHeaders } from '@/lib/portal-storage'

export function useBookmarkSolver(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (submissionId: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.post<unknown>(
          PORTAL.BOOKMARK(submissionId),
          {},
          { headers: getPortalHeaders() },
        )
        unwrapSuccessData<{ ok: true }>(res.data)
        onSuccess?.()
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onSuccess],
  )

  return { mutate, loading, error }
}
