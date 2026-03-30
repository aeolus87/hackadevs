import { NavLink } from 'react-router-dom'
import { useAuthUser } from '@/contexts/auth-context'

const nav = [
  { to: '/feed', label: 'Feed' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/settings', label: 'Settings' },
] as const

export function Sidebar() {
  const { user, isAuthenticated } = useAuthUser()
  const profileTo = user ? `/u/${user.username}` : '/login'

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[220px] flex-col border-r border-hd-border bg-hd-surface md:flex">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-hd-indigo font-mono text-[11px] font-medium text-white">
          HD
        </div>
        <span className="text-base font-medium text-hd-text">HackaDevs</span>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
                isActive
                  ? 'border-l-2 border-hd-indigo bg-hd-indigo-surface text-hd-indigo-tint'
                  : 'border-l-2 border-transparent text-hd-secondary hover:bg-hd-hover'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <NavLink
          to={profileTo}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out ${
              isActive
                ? 'border-l-2 border-hd-indigo bg-hd-indigo-surface text-hd-indigo-tint'
                : 'border-l-2 border-transparent text-hd-secondary hover:bg-hd-hover'
            }`
          }
        >
          {isAuthenticated ? 'My profile' : 'Sign in'}
        </NavLink>
      </nav>
      <div className="flex items-center gap-3 border-t border-hd-border p-4">
        {isAuthenticated && user ? (
          <>
            <img
              src={
                user.avatarUrl ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
              }
              alt=""
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
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
          </>
        ) : (
          <NavLink
            to="/login"
            className="text-sm font-medium text-hd-indigo-tint hover:text-hd-indigo-hover"
          >
            Sign in
          </NavLink>
        )}
      </div>
    </aside>
  )
}
