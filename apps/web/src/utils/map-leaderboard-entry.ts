import type { LeaderboardEntry as ApiEntry } from '@/types/hackadevs-api.types'
import type { LeaderboardRow } from '@/types/hackadevs'
import { apiCategoryToUi } from '@/utils/map-api-category'
import type { PlatformTier, SelfDeclaredLevel } from '@/types/hackadevs'

const avatarFallback = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`

export function apiLeaderboardEntryToRow(e: ApiEntry): LeaderboardRow {
  const u = e.user
  return {
    rank: e.rank,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatarUrl ?? avatarFallback(u.username),
    tagline: '',
    rep: u.totalRep,
    rankPercentile: '',
    tier: 'Mid',
    selfDeclaredLevel: 'MID' as SelfDeclaredLevel,
    platformTier: 'ENGINEER' as PlatformTier,
    topCategory: apiCategoryToUi(e.bestCategory),
    streak: 0,
    weeklyDelta: e.weeklyRankDelta,
    rankMovement: 0,
    challengesSolved: e.challengesSolved,
    skills: {},
  }
}
