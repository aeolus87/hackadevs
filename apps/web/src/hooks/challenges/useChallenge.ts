import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { CHALLENGES } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { Challenge } from '@/types/hackadevs-api.types'

export function useChallenge(slug: string) {
  const [data, setData] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!slug) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get<Challenge>(CHALLENGES.DETAIL(slug))
      setData(res.data)
    } catch (e) {
      const { message, status } = parseAxiosError(e)
      setError(message)
      if (status === 404) setData(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
