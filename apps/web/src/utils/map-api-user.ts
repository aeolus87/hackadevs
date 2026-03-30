import type { DevUser as ApiDevUser } from '@/types/hackadevs-api.types'
import type {
  DevTier,
  DevUser as UiDevUser,
  PlatformTier,
  SelfDeclaredLevel,
} from '@/types/hackadevs'
import { apiCategoryToUi } from '@/utils/map-api-category'
import type { ChallengeCategory } from '@/types/hackadevs'

function apiTierToDevTier(t: ApiDevUser['tier']): DevTier {
  if (t === 'PRINCIPAL' || t === 'LEGEND') return 'Senior'
  if (t === 'SENIOR' || t === 'STAFF') return 'Mid'
  return 'Junior'
}

const avatarFallback = (username: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`

export function apiDevUserToUi(u: ApiDevUser): UiDevUser {
  const skills: Partial<Record<ChallengeCategory, number>> = {}
  const categoryRanks: Partial<Record<ChallengeCategory, number>> = {}
  let topCategory: ChallengeCategory = 'Backend'
  let maxRep = -1
  for (const row of u.categoryReps) {
    const cat = apiCategoryToUi(row.category)
    if (row.rep > maxRep) {
      maxRep = row.rep
      topCategory = cat
    }
    const pct =
      u.totalRep > 0 ? Math.min(100, Math.round((row.rep / Math.max(1, u.totalRep)) * 100)) : 0
    skills[cat] = pct
    if (row.rank != null) categoryRanks[cat] = row.rank
  }
  const tierUi = apiTierToDevTier(u.tier)
  const platformTier = u.tier as PlatformTier
  const selfDeclaredLevel = u.selfDeclaredLevel as SelfDeclaredLevel
  return {
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatarUrl ?? avatarFallback(u.username),
    tagline: u.tagline ?? '',
    rep: u.totalRep,
    rankPercentile:
      u.globalRank != null && u.globalRank > 0
        ? `Top ${Math.min(99, Math.round(100 / Math.sqrt(u.globalRank)))}%`
        : '',
    tier: tierUi,
    selfDeclaredLevel,
    platformTier,
    topCategory,
    streak: u.currentStreakDays,
    weeklyDelta: u.weeklyRepDelta,
    rankMovement: 0,
    challengesSolved: 0,
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    portfolioUrl: u.websiteUrl,
    twitterUrl: u.twitterUrl,
    skills,
    categoryRanks,
  }
}
