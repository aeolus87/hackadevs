import { useCallback, useState } from 'react'
import { useToast } from '@/contexts/toast-context'
import { axiosInstance } from '@/utils/axios.instance'
import { VOTES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useRetractVote(onSettled?: () => void) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (submissionId: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.delete(VOTES.RETRACT(submissionId))
        onSettled?.()
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        toast.push(message, 'error')
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onSettled, toast],
  )

  return { mutate, loading, error }
}
