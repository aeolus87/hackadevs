import { useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { SEARCH } from '@/utils/api.routes'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { parseAxiosError } from '@/utils/axios-message'
import type { GlobalSearchResponse } from '@/types/hackadevs-api.types'

export function useGlobalSearch(rawQuery: string) {
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(rawQuery.trim()), 300)
    return () => window.clearTimeout(t)
  }, [rawQuery])

  const [data, setData] = useState<GlobalSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (debounced.length < 2) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    const ac = new AbortController()
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const res = await axiosInstance.get<unknown>(SEARCH({ q: debounced }), {
          signal: ac.signal,
        })
        setData(unwrapSuccessData<GlobalSearchResponse>(res.data))
        setError(null)
      } catch (e) {
        if (ac.signal.aborted) return
        setError(parseAxiosError(e).message)
        setData(null)
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    })()

    return () => ac.abort()
  }, [debounced])

  return { data, loading, error, debouncedQuery: debounced }
}
