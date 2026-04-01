import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { PORTAL } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { getPortalHeaders } from '@/lib/portal-storage'
import type { PortalCompanyChallenge } from '@/types/portal.types'

export function useSubmitPortalChallenge() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (rawProblem: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post<unknown>(
        PORTAL.CHALLENGES(),
        { rawProblem },
        { headers: getPortalHeaders() },
      )
      return unwrapSuccessData<PortalCompanyChallenge>(res.data)
    } catch (e) {
      const { message } = parseAxiosError(e)
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}
