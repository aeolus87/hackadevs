import { useCallback, useState } from 'react'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { axiosInstance } from '@/utils/axios.instance'
import { SUBMISSIONS } from '@/utils/api.routes'
import type { Submission } from '@/types/hackadevs-api.types'

export function useWithdrawForRevision() {
  const [loading, setLoading] = useState(false)

  const withdraw = useCallback(async (submissionId: string) => {
    setLoading(true)
    try {
      const res = await axiosInstance.post(SUBMISSIONS.WITHDRAW_FOR_REVISION(submissionId))
      return unwrapSuccessData<Submission>(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  return { withdraw, loading }
}
