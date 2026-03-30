import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { DevUser } from '@/types/hackadevs'
import { RepScore } from '@/components/rep-score'
import { categoryPillClass } from '@/utils/category-styles'

type UserHoverCardProps = {
  user: Pick<DevUser, 'username' | 'displayName' | 'avatar' | 'rep' | 'topCategory'>
  children: ReactNode
}

export function UserHoverCard({ user, children }: UserHoverCardProps) {
  const [open, setOpen] = useState(false)
  const t = useRef<number | null>(null)

  const onEnter = useCallback(() => {
    t.current = window.setTimeout(() => setOpen(true), 400)
  }, [])

  const onLeave = useCallback(() => {
    if (t.current != null) window.clearTimeout(t.current)
    setOpen(false)
  }, [])

  return (
    <span className="relative inline-block" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link to={`/u/${user.username}`} className="text-inherit no-underline">
        {children}
      </Link>
      {open && (
        <div className="pointer-events-auto absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-hd-border bg-hd-elevated p-3 shadow-[var(--shadow-hd-card)]">
          <div className="flex items-center gap-2">
            <img
              src={user.avatar}
              alt=""
              className="h-10 w-10 rounded-full"
              width={40}
              height={40}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-hd-text">{user.displayName}</p>
              <p className="font-mono text-[11px] text-hd-muted">@{user.username}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <RepScore value={user.rep} className="text-sm" />
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${categoryPillClass(user.topCategory)}`}
            >
              {user.topCategory}
            </span>
          </div>
        </div>
      )}
    </span>
  )
}
