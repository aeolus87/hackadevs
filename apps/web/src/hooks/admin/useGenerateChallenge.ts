import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import type { Category } from '@/types/hackadevs-api.types'

export function useGenerateChallenge() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (theme: string, category: Category) => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.post<unknown>(ADMIN.GENERATE(), { theme, category })
      return unwrapSuccessData<{ id: string; slug?: string }>(res.data)
    } catch (e) {
      const msg = parseAxiosError(e).message
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}
