import { useCallback, useEffect, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { ADMIN } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { normalizePaginated } from '@/utils/normalize-paginated'

export type AdminPortalRow = {
  id: string
  companyName: string
  domainEmail: string
  linkedinUrl: string | null
  contactName: string
  contactEmail: string
  isVerified: boolean
  verifiedAt: string | null
  isApproved: boolean
  rejectedAt: string | null
  createdAt: string
  _count: { challenges: number; bookmarks: number }
}

export function useAdminPortals(params?: {
  status?: 'pending' | 'approved' | 'all'
  page?: number
  limit?: number
}) {
  const status = params?.status ?? 'pending'
  const page = params?.page ?? 1
  const limit = params?.limit ?? 20
  const [data, setData] = useState<ReturnType<typeof normalizePaginated<AdminPortalRow>> | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axiosInstance.get(ADMIN.PORTALS({ status, page, limit }))
      setData(normalizePaginated<AdminPortalRow>(res.data, page, limit))
    } catch (e) {
      setError(parseAxiosError(e).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [status, page, limit])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}
