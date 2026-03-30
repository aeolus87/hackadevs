import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function usePinSolution(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (submissionId: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.post(USERS.PIN(submissionId))
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
