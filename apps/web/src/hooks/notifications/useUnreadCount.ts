import { useMemo } from 'react'
import { useNotifications } from '@/hooks/notifications/useNotifications'

export function useUnreadCount() {
  const { data, loading, error } = useNotifications({
    page: 1,
    limit: 200,
    unreadOnly: true,
  })
  const count = useMemo(() => {
    if (!data?.data?.length) return 0
    return data.data.filter((n) => !n.isRead).length
  }, [data])
  return { count, loading, error }
}
