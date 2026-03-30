import { useCallback, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import type { DevUser, SelfLevel } from '@/types/hackadevs-api.types'

export type UpdateProfilePayload = Partial<{
  displayName: string
  tagline: string
  githubUrl: string
  linkedinUrl: string
  websiteUrl: string
  twitterUrl: string
  selfDeclaredLevel: SelfLevel
  avatarUrl: string
}>

export function useUpdateProfile() {
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (payload: UpdateProfilePayload) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.patch<DevUser>(USERS.ME(), payload)
        setUser(res.data)
      } catch (e) {
        const { message } = parseAxiosError(e)
        setError(message)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [setUser],
  )

  return { mutate, loading, error }
}
