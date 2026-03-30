import { Link } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'

export function TopBar() {
  const { isAuthenticated } = useAuthUser()
  const { count: unread } = useUnreadCount()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hd-border bg-hd-page px-4 py-3 md:pl-[calc(220px+1rem)]">
      <label className="sr-only" htmlFor="global-search">
        Search
      </label>
      <input
        id="global-search"
        type="search"
        placeholder="Search challenges, devs, tags…"
        className="min-w-0 flex-1 rounded-lg border border-hd-border bg-hd-surface px-3 py-2 text-sm text-hd-text placeholder:text-hd-muted transition-[border-color] duration-150 ease-out focus:border-hd-border-hover focus:outline-none"
      />
      <Link
        to="/notifications"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-hd-border bg-hd-surface text-hd-secondary transition-colors duration-150 ease-out hover:border-hd-border-hover hover:text-hd-text"
        aria-label="Notifications"
      >
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-hd-rose px-1 font-mono text-[10px] font-medium text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </Link>
      {isAuthenticated && (
        <Link
          to="/challenge/stripe-idempotency-ledger/submit"
          className="hidden shrink-0 rounded-full bg-hd-indigo px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover sm:inline-flex sm:items-center sm:justify-center"
        >
          Submit solution
        </Link>
      )}
    </header>
  )
}
