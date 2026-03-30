import type { ActivityItem } from '@/types/hackadevs'

function ActivityIcon({ kind }: { kind: NonNullable<ActivityItem['kind']> }) {
  if (kind === 'solve') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hd-border bg-hd-surface text-hd-emerald">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M9 12l2 2 4-4M12 3a9 9 0 100 18 9 9 0 000-18z" />
        </svg>
      </span>
    )
  }
  if (kind === 'follow') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hd-border bg-hd-surface text-hd-indigo-tint">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      </span>
    )
  }
  if (kind === 'badge') {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hd-border bg-hd-surface text-hd-amber">
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hd-border bg-hd-surface text-hd-muted">
      <span className="font-mono text-xs">•</span>
    </span>
  )
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-hd-muted">No activity yet.</p>
  }
  return (
    <ul className="space-y-0">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex gap-3 border-b border-hd-border py-3 last:border-0 last:pb-0"
        >
          <ActivityIcon kind={item.kind ?? 'default'} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-hd-secondary">{item.text}</p>
            <p className="mt-0.5 font-mono text-[11px] text-hd-muted">{item.time}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
