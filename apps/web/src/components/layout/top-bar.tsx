import { Link } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useUnreadCount } from '@/hooks/notifications/useUnreadCount'
import { useSubmitSolutionHref } from '@/hooks/challenges/useSubmitSolutionHref'
import { HackaDevsMark } from '@/components/layout/hackadevs-mark'

export function TopBar() {
  const { isAuthenticated } = useAuthUser()
  const { count: unread } = useUnreadCount()
  const submit = useSubmitSolutionHref()

  return (
    <div className="flex min-h-14 min-w-0 flex-1 items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
      <Link
        to="/feed"
        className="flex shrink-0 items-center gap-2.5 rounded-xl py-0.5 md:hidden"
        aria-label="HackaDevs home"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-hd-text">
          <HackaDevsMark className="h-7 w-7" />
        </span>
        <span className="max-w-[6.5rem] truncate text-sm font-semibold tracking-tight text-hd-text sm:max-w-none">
          HackaDevs
        </span>
      </Link>

      {isAuthenticated ? (
        <div className="ml-auto flex shrink-0 items-center gap-1.5 rounded-2xl border border-hd-border/60 bg-hd-surface/50 p-1 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-hd-secondary transition-colors duration-150 ease-out hover:bg-hd-hover hover:text-hd-text"
            aria-label="Notifications"
          >
            {unread > 0 && (
              <span className="absolute right-0 top-0 flex h-3.5 min-w-3.5 translate-x-0.5 -translate-y-0.5 items-center justify-center rounded-full bg-hd-rose px-0.5 font-mono text-[9px] font-medium leading-none text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
            <svg
              className="h-[17px] w-[17px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          </Link>
          <Link
            to={submit.href}
            title={
              submit.hasActive
                ? `Submit a solution${submit.challengeTitle ? ` — ${submit.challengeTitle}` : ''}`
                : 'Open a challenge from the feed, then submit from its page'
            }
            className="hidden rounded-xl bg-hd-indigo px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 ease-out hover:bg-hd-indigo-hover sm:inline-flex sm:items-center sm:justify-center"
          >
            Submit
          </Link>
        </div>
      ) : null}
    </div>
  )
}
