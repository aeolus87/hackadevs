import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import type { AdminChallengeDetail } from './useAdminChallenge'

export type PatchChallengeBody = Record<string, unknown>

export function useUpdateChallenge(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (id: string, body: PatchChallengeBody) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.patch<unknown>(ADMIN.CHALLENGE(id), body)
        const ch = unwrapSuccessData<AdminChallengeDetail>(res.data)
        onSuccess?.()
        return ch
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
