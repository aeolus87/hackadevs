import { NavLink, useLocation } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { useSubmitSolutionHref } from '@/hooks/challenges/useSubmitSolutionHref'
import { NavIcon } from '@/components/layout/nav-icons'

const tabsBase = [
  { to: '/feed', label: 'Home', icon: 'feed' as const },
  { to: '/leaderboard', label: 'Board', icon: 'chart' as const },
  { to: '/challenges', label: 'Browse', icon: 'grid' as const },
] as const

export function MobileTabBar() {
  const { user, isAuthenticated } = useAuthUser()
  const submit = useSubmitSolutionHref()
  const location = useLocation()
  const profileTo = user ? `/u/${user.username}` : '/login'
  const profileState = !isAuthenticated
    ? { returnTo: `${location.pathname}${location.search}` }
    : undefined

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-hd-border/90 bg-hd-surface/95 px-1 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_-4px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden">
      {tabsBase.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium leading-tight transition-colors duration-150 ${
              isActive ? 'text-hd-indigo-tint' : 'text-hd-muted'
            }`
          }
          aria-label={t.label}
        >
          <NavIcon name={t.icon} className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate px-0.5">{t.label}</span>
        </NavLink>
      ))}
      <NavLink
        to={profileTo}
        state={profileState}
        className={({ isActive }) =>
          `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium leading-tight transition-colors duration-150 ${
            isActive ? 'text-hd-indigo-tint' : 'text-hd-muted'
          }`
        }
        aria-label={isAuthenticated ? 'Profile' : 'Account'}
      >
        <NavIcon name="user" className="h-5 w-5 shrink-0" />
        <span className="max-w-full truncate px-0.5">{isAuthenticated ? 'Profile' : 'Account'}</span>
      </NavLink>
      {isAuthenticated && (
        <NavLink
          to={submit.href}
          title={
            submit.hasActive
              ? `Submit — ${submit.challengeTitle ?? ''}`
              : 'Pick a challenge in the catalog'
          }
          className="flex min-w-0 flex-1 flex-col items-center justify-center py-1.5 text-hd-indigo-tint"
          aria-label="Submit a solution"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hd-indigo text-white">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className="mt-0.5 max-w-full truncate px-0.5 text-[10px] font-medium">Submit</span>
        </NavLink>
      )}
    </nav>
  )
}
