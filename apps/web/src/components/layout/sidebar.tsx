import { NavLink, useLocation } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'
import { NavIcon } from '@/components/layout/nav-icons'

const nav = [
  { to: '/feed', label: 'Home', icon: 'feed' as const },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'leaderboard' as const },
  { to: '/challenges', label: 'Challenges', icon: 'challenges' as const },
  { to: '/settings', label: 'Settings', icon: 'settings' as const },
] as const

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
    isActive
      ? 'bg-hd-indigo-surface text-hd-indigo-tint'
      : 'text-hd-secondary hover:bg-hd-hover hover:text-hd-text'
  }`

export function Sidebar() {
  const { user, isAuthenticated } = useAuthUser()
  const location = useLocation()
  const profileTo = user ? `/u/${user.username}` : '/login'
  const profileState = !isAuthenticated
    ? { returnTo: `${location.pathname}${location.search}` }
    : undefined
  const staff = user?.role === 'ADMIN' || user?.role === 'MODERATOR'

  return (
    <aside className="fixed left-0 top-14 z-20 hidden h-[calc(100vh-3.5rem)] w-[232px] flex-col border-r border-hd-border/80 bg-hd-surface/95 backdrop-blur-xl md:flex">
      <nav className="flex flex-1 flex-col gap-1 px-2.5 pb-3 pt-6">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass}>
            <span className="flex items-center gap-3">
              <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0 opacity-90" />
              {item.label}
            </span>
          </NavLink>
        ))}
        {staff && (
          <>
            <div className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-hd-muted">
              Admin
            </div>
            <NavLink to="/admin/challenges" className={navLinkClass}>
              <span className="flex items-center gap-3">
                <NavIcon name="challenges" className="h-[18px] w-[18px] shrink-0 opacity-90" />
                Challenges
              </span>
            </NavLink>
          </>
        )}
        <NavLink to={profileTo} state={profileState} className={navLinkClass}>
          <span className="flex items-center gap-3">
            <NavIcon name="user" className="h-[18px] w-[18px] shrink-0 opacity-90" />
            {isAuthenticated ? 'Profile' : 'Account'}
          </span>
        </NavLink>
      </nav>
      {isAuthenticated && user ? (
        <div className="flex items-center gap-3 border-t border-hd-border/80 p-4">
          <img
            src={
              user.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
            }
            alt=""
            className="h-9 w-9 rounded-full ring-1 ring-hd-border"
            width={36}
            height={36}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-hd-text">{user.displayName}</p>
            <p className="flex items-center gap-1 font-mono text-[11px] text-hd-amber">
              <span className="inline-block h-3 w-3" aria-hidden>
                <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3">
                  <path d="M8 1c0 2-1.5 3-2 5a2 2 0 104 0c-.5-2-2-3-2-5zm-3.5 9c-.8 0-1.5.7-1.5 1.5V14h9v-2.5c0-.8-.7-1.5-1.5-1.5h-6z" />
                </svg>
              </span>
              {user.currentStreakDays} day streak
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  )
}
