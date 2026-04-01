import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { PORTAL } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'

export type RegisterPortalPayload = {
  companyName: string
  domainEmail: string
  linkedinUrl?: string
  contactName: string
  contactEmail: string
}

export function useRegisterPortal() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (payload: RegisterPortalPayload) => {
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, string> = {
        companyName: payload.companyName,
        domainEmail: payload.domainEmail,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
      }
      if (payload.linkedinUrl?.trim()) {
        body.linkedinUrl = payload.linkedinUrl.trim()
      }
      const res = await axiosInstance.post<unknown>(PORTAL.REGISTER(), body)
      return unwrapSuccessData<{
        portalId: string
        portalSecret: string
      }>(res.data)
    } catch (e) {
      const { message } = parseAxiosError(e)
      setError(message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { mutate, loading, error }
}
