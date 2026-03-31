import type { LeaderboardEntry as ApiEntry } from '@/types/hackadevs-api.types'
import type { DevTier, LeaderboardRow, PlatformTier, SelfDeclaredLevel } from '@/types/hackadevs'
import { apiCategoryToUi } from '@/utils/map-api-category'

const avatarFallback = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`

function apiTierToDevTier(t: ApiEntry['tier']): DevTier {
  if (t === 'PRINCIPAL' || t === 'LEGEND') return 'Senior'
  if (t === 'SENIOR' || t === 'STAFF') return 'Mid'
  return 'Junior'
}

export type LeaderboardRankOpts = { page?: number; limit?: number; index?: number }

export function apiLeaderboardEntryToRow(e: ApiEntry, opts?: LeaderboardRankOpts): LeaderboardRow {
  const page = opts?.page ?? 1
  const limit = opts?.limit ?? 50
  const idx = opts?.index ?? 0
  const rank = e.categoryRank ?? e.globalRank ?? (page - 1) * limit + idx + 1
  const username = e.username
  const platformTier = e.tier as PlatformTier
  return {
    rank,
    username,
    displayName: e.displayName,
    avatar: e.avatarUrl ?? avatarFallback(username),
    tagline: '',
    rep: e.totalRep,
    rankPercentile:
      e.globalRank != null && e.globalRank > 0
        ? `Top ${Math.min(99, Math.round(100 / Math.sqrt(e.globalRank)))}%`
        : '',
    tier: apiTierToDevTier(e.tier),
    selfDeclaredLevel: 'MID' as SelfDeclaredLevel,
    platformTier,
    topCategory: e.bestCategory != null ? apiCategoryToUi(e.bestCategory) : 'Backend',
    streak: e.currentStreakDays,
    weeklyDelta: e.weeklyRepDelta,
    rankMovement: 0,
    challengesSolved: 0,
    skills: {},
  }
}
