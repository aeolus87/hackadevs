import { Link } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useNotifications } from '@/hooks/notifications/useNotifications'
import { useMarkRead } from '@/hooks/notifications/useMarkRead'
import { useMarkAllRead } from '@/hooks/notifications/useMarkAllRead'
import { InlineError } from '@/components/inline-error'
import { SkeletonCard } from '@/components/skeleton-card'

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthUser()
  const { data, loading, error, refetch } = useNotifications({ page: 1, limit: 50 })
  const { mutate: markRead } = useMarkRead(refetch)
  const { mutate: markAll, loading: allBusy } = useMarkAllRead(refetch)

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-[16px] border border-hd-border bg-hd-card p-8">
        <h1 className="text-xl font-medium text-hd-text">Notifications</h1>
        <p className="text-sm text-hd-secondary">
          Sign in to see challenge updates, streaks, and mentions.
        </p>
        <Link
          to="/login"
          state={{ returnTo: '/notifications' }}
          className="inline-flex rounded-full bg-hd-indigo px-5 py-2 text-sm font-medium text-white hover:bg-hd-indigo-hover"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-hd-text">Notifications</h1>
        <button
          type="button"
          disabled={allBusy || !data?.data.length}
          onClick={() => void markAll()}
          className="rounded-full border border-hd-border px-3 py-1.5 text-xs font-medium text-hd-secondary hover:border-hd-border-hover disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>
      {loading && (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}
      {error && (
        <InlineError
          message={`Could not load notifications. ${error}`}
          onRetry={() => void refetch()}
        />
      )}
      {!loading && !error && data && data.data.length === 0 && (
        <p className="text-sm text-hd-muted">No notifications yet.</p>
      )}
      <ul className="space-y-2">
        {data?.data.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => {
                if (!n.isRead) void markRead(n.id)
              }}
              className={`w-full rounded-[12px] border border-hd-border p-4 text-left transition-colors duration-150 hover:bg-hd-hover ${
                n.isRead ? 'bg-hd-card opacity-70' : 'bg-hd-indigo-surface'
              }`}
            >
              <p className="text-sm font-medium text-hd-text">{n.title}</p>
              <p className="mt-1 text-sm text-hd-secondary">{n.body}</p>
              <p className="mt-2 font-mono text-[11px] text-hd-muted">{n.createdAt}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
