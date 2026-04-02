import { useCallback, useState } from 'react'
import { axiosInstance } from '@/utils/axios.instance'
import { USERS } from '@/utils/api.routes'
import { parseAxiosError } from '@/utils/axios-message'
import { unwrapSuccessData } from '@/lib/api-unwrap'
import { useUpdateProfile } from '@/hooks/users/useUpdateProfile'

export function useUploadAvatar() {
  const { mutate: updateProfile } = useUpdateProfile()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setLoading(true)
      setError(null)
      try {
        const res = await axiosInstance.post(USERS.AVATAR(), {
          filename: file.name,
          contentType: file.type,
        })
        const { uploadUrl, publicUrl } = unwrapSuccessData<{
          uploadUrl: string
          publicUrl: string
          key: string
        }>(res.data)
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!put.ok) {
          throw new Error(`Storage upload failed (${put.status})`)
        }
        await updateProfile({ avatarUrl: publicUrl })
        return publicUrl
      } catch (e) {
        const msg = e instanceof Error && e.message ? e.message : parseAxiosError(e).message
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    [updateProfile],
  )

  return { upload, loading, error }
}
