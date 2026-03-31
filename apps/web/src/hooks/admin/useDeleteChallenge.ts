import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useDeleteChallenge(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.delete(ADMIN.CHALLENGE(id))
        onSuccess?.()
      } catch (e) {
        setError(parseAxiosError(e).message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onSuccess],
  )

  return { mutate, loading, error }
}
