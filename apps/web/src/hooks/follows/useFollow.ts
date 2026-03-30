import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { FOLLOWS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'

export function useFollow(onSettled?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (username: string) => {
      setLoading(true)
      setError(null)
      try {
        await axiosInstance.post(FOLLOWS.FOLLOW(username))
        onSettled?.()
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [onSettled],
  )

  return { mutate, loading, error }
}
