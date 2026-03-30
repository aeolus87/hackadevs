import { Link } from 'react-router-dom'
import type { DevUser, SelfDeclaredLevel } from '@/types/hackadevs'
import { RepScore } from '@/components/rep-score'
import { SocialLinkRow } from '@/components/social-link-row'
import { avatarRingClass } from '@/utils/category-styles'
import { platformTierPillClass } from '@/utils/tier-styles'

type DevProfileHeaderProps = {
  user: DevUser
  viewerUsername?: string | null
  following?: boolean
  followBusy?: boolean
  onFollowToggle?: () => void
}

function declaredLabel(level: SelfDeclaredLevel): string {
  if (level === 'SENIOR') return 'SENIOR'
  if (level === 'MID') return 'MID'
  return 'JUNIOR'
}

export function DevProfileHeader({
  user,
  viewerUsername,
  following,
  followBusy,
  onFollowToggle,
}: DevProfileHeaderProps) {
  const isSelf = viewerUsername != null && user.username === viewerUsername
  const ring = avatarRingClass(user.topCategory)
  const declared =
    user.selfDeclaredLevel ??
    (user.tier === 'Senior' ? 'SENIOR' : user.tier === 'Mid' ? 'MID' : 'JUNIOR')

  return (
    <div className="rounded-[16px] border border-hd-border bg-hd-elevated p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <img
            src={user.avatar}
            alt=""
            className={`h-[72px] w-[72px] shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-hd-elevated ${ring}`}
            width={72}
            height={72}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium text-hd-text md:text-2xl">{user.displayName}</h1>
            <p className="mt-1 font-mono text-sm text-hd-muted">@{user.username}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${platformTierPillClass(user.platformTier)}`}
              >
                {user.platformTier}
              </span>
              <span className="rounded-full border border-hd-border bg-hd-surface px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-hd-muted">
                {declaredLabel(declared)}
              </span>
            </div>
            {user.tagline && (
              <p className="mt-3 max-w-xl text-sm text-hd-secondary">{user.tagline}</p>
            )}
            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <RepScore value={user.rep} className="text-[36px] font-medium leading-none" />
              <span className="rounded-full border border-hd-indigo/40 bg-hd-indigo-surface px-2 py-0.5 font-mono text-[13px] text-hd-indigo-tint">
                {user.rankPercentile}
              </span>
            </div>
            <div className="mt-3">
              <SocialLinkRow
                githubUrl={user.githubUrl}
                linkedinUrl={user.linkedinUrl}
                portfolioUrl={user.portfolioUrl}
                twitterUrl={user.twitterUrl}
              />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          {isSelf ? (
            <Link
              to="/settings"
              className="rounded-full border border-hd-border px-4 py-2 text-center text-sm font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-border-hover"
            >
              Edit profile
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled={followBusy || !onFollowToggle}
                onClick={() => onFollowToggle?.()}
                className="rounded-full border border-hd-border px-4 py-2 text-sm font-medium text-hd-text transition-colors duration-150 ease-out hover:border-hd-border-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {following ? 'Unfollow' : 'Follow'}
              </button>
              <Link
                to={`/u/${user.username}#pinned`}
                className="rounded-full border border-hd-border px-4 py-2 text-center text-sm font-medium text-hd-secondary transition-colors duration-150 ease-out hover:border-hd-border-hover hover:text-hd-text"
              >
                View solutions
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
