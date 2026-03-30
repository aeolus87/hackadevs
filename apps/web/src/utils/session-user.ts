import type { DevUser } from '@/types/hackadevs-api.types'

export function sessionUserFromAuthResponse(
  u: Partial<DevUser> & { id: string; username: string; displayName: string },
): DevUser {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    tagline: u.tagline,
    avatarUrl: u.avatarUrl,
    githubUrl: u.githubUrl,
    linkedinUrl: u.linkedinUrl,
    websiteUrl: u.websiteUrl,
    twitterUrl: u.twitterUrl,
    totalRep: u.totalRep ?? 0,
    globalRank: u.globalRank,
    currentStreakDays: u.currentStreakDays ?? 0,
    tier: u.tier ?? 'NOVICE',
    selfDeclaredLevel: u.selfDeclaredLevel ?? 'MID',
    weeklyRepDelta: u.weeklyRepDelta ?? 0,
    categoryReps: u.categoryReps ?? [],
    badges: u.badges ?? [],
  }
}
