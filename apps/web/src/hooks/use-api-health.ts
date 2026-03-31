import { useEffect, useState } from 'react'
import type { HealthResponse } from '@hackadevs/core'
import { axiosInstance } from '@/utils/axios.instance'
import { HEALTH } from '@/utils/api.routes'

export function useApiHealth() {
  const [healthy, setHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    axiosInstance
      .get<HealthResponse>(HEALTH())
      .then((res) => {
        if (!cancelled) setHealthy(res.data.status === 'ok')
      })
      .catch(() => {
        if (!cancelled) setHealthy(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return healthy
}
