import { NavLink } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'

const tabsBase = [
  { to: '/feed', label: 'Feed', icon: 'feed' as const },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'chart' as const },
  { to: '/challenges', label: 'Challenges', icon: 'grid' as const },
] as const

function Icon({ name }: { name: 'feed' | 'chart' | 'grid' | 'user' }) {
  if (name === 'feed') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    )
  }
  if (name === 'chart') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19V5M9 19v-6M14 19V9M19 19v-9" />
      </svg>
    )
  }
  if (name === 'grid') {
    return (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  }
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

export function MobileTabBar() {
  const { user, isAuthenticated } = useAuthUser()
  const profileTo = user ? `/u/${user.username}` : '/login'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-hd-border bg-hd-surface px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
      {tabsBase.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150 ${
              isActive ? 'text-hd-indigo-tint' : 'text-hd-muted'
            }`
          }
          aria-label={t.label}
        >
          <Icon name={t.icon} />
        </NavLink>
      ))}
      <NavLink
        to={profileTo}
        className={({ isActive }) =>
          `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150 ${
            isActive ? 'text-hd-indigo-tint' : 'text-hd-muted'
          }`
        }
        aria-label={isAuthenticated ? 'Profile' : 'Sign in'}
      >
        <Icon name="user" />
      </NavLink>
      {isAuthenticated && (
        <NavLink
          to="/challenge/stripe-idempotency-ledger/submit"
          className="flex flex-1 flex-col items-center justify-center py-2 text-hd-indigo-tint"
          aria-label="Submit"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-hd-indigo text-white">
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
        </NavLink>
      )}
    </nav>
  )
}
