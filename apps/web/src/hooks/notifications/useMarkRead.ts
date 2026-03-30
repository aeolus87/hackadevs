import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { NOTIFICATIONS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useMarkRead(onInvalidate?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.patch(NOTIFICATIONS.MARK_READ(id))
        onInvalidate?.()
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onInvalidate],
  )

  return { mutate, loading, error }
}
