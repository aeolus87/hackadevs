import type { AvailabilityStatus, CategoryRep, User, UserRole } from '@prisma/client'

export type UserPublicShape = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  tagline: string | null
  githubUrl: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  twitterUrl: string | null
  tier: User['tier']
  role: UserRole
  totalRep: number
  globalRank: number | null
  currentStreakDays: number
  selfDeclaredLevel: User['selfDeclaredLevel']
  weeklyRepDelta: number
  availabilityStatus: AvailabilityStatus
  badges: { type: string; awardedAt: string }[]
  categoryReps: { category: CategoryRep['category']; rep: number; rank: number | null }[]
}

export function toUserPublic(u: User & { categoryReps?: CategoryRep[] }): UserPublicShape {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    tagline: u.tagline,
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    websiteUrl: u.websiteUrl,
    twitterUrl: u.twitterUrl,
    tier: u.tier,
    role: u.role,
    totalRep: u.totalRep,
    globalRank: u.globalRank,
    currentStreakDays: u.currentStreakDays,
    selfDeclaredLevel: u.selfDeclaredLevel,
    weeklyRepDelta: u.weeklyRepDelta,
    availabilityStatus: u.availabilityStatus,
    badges: [],
    categoryReps: (u.categoryReps ?? []).map((c) => ({
      category: c.category,
      rep: c.rep,
      rank: c.rank ?? null,
    })),
  }
}
