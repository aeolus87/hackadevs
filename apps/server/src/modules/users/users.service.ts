import type { PrismaClient } from '@prisma/client'
import type { PatchMeBody } from './users.schema.js'

export function createUsersService(prisma: PrismaClient) {
  return {
    async getMe(userId: string) {
      return prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: { categoryReps: { where: { deletedAt: null } } },
      })
    },

    async patchMe(userId: string, body: PatchMeBody) {
      return prisma.user.update({
        where: { id: userId },
        data: body,
        include: { categoryReps: { where: { deletedAt: null } } },
      })
    },

    async getPublicProfile(username: string, viewerId: string | null) {
      const u = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), deletedAt: null },
        include: {
          categoryReps: { where: { deletedAt: null } },
          badges: { where: { deletedAt: null }, orderBy: { awardedAt: 'desc' } },
          pinnedSubmissions: {
            where: { deletedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              submission: {
                include: { challenge: { select: { title: true, slug: true } } },
              },
            },
          },
        },
      })
      if (!u) return null
      let viewerFollows = false
      if (viewerId && viewerId !== u.id) {
        const f = await prisma.follow.findFirst({
          where: { followerId: viewerId, followeeId: u.id, deletedAt: null },
          select: { id: true },
        })
        viewerFollows = f != null
      }
      const pinnedSubmissions = u.pinnedSubmissions.map((p) => ({
        id: p.submission.id,
        challengeSlug: p.submission.challenge.slug,
        challengeTitle: p.submission.challenge.title,
        finalRank: p.submission.finalRank,
        preliminaryRank: p.submission.preliminaryRank,
        upvoteCount: p.submission.upvoteCount,
        downvoteCount: p.submission.downvoteCount,
        rationaleExcerpt: p.submission.rationaleApproach.slice(0, 120),
        submittedAt: p.submission.submittedAt?.toISOString() ?? null,
      }))
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
        totalRep: u.totalRep,
        globalRank: u.globalRank,
        weeklyRepDelta: u.weeklyRepDelta,
        tier: u.tier,
        selfDeclaredLevel: u.selfDeclaredLevel,
        availabilityStatus: u.availabilityStatus,
        currentStreakDays: u.currentStreakDays,
        longestStreakDays: u.longestStreakDays,
        isVerified: u.isVerified,
        categoryReps: u.categoryReps,
        badges: u.badges,
        pinnedSubmissions,
        viewerFollows,
      }
    },

    async getActivityFeedByUsername(username: string, page: number, limit: number) {
      const u = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), deletedAt: null },
        select: { id: true },
      })
      if (!u) return null
      return this.getActivityFeed(u.id, page, limit)
    },

    async getSolutionsByUsername(username: string, page: number, limit: number) {
      const u = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), deletedAt: null },
      })
      if (!u) return null
      const skip = (page - 1) * limit
      const where = {
        userId: u.id,
        status: 'PUBLISHED' as const,
        deletedAt: null,
      }
      const [items, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          include: { challenge: { select: { slug: true, title: true, category: true } } },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.submission.count({ where }),
      ])
      return { user: u, items, total, page, limit }
    },

    async getActivityFeed(userId: string, page: number, limit: number) {
      const skip = (page - 1) * limit
      const [subs, badges, follows] = await Promise.all([
        prisma.submission.findMany({
          where: { userId, status: 'PUBLISHED', deletedAt: null },
          orderBy: { submittedAt: 'desc' },
          take: 20,
          include: { challenge: { select: { title: true, slug: true } } },
        }),
        prisma.badge.findMany({
          where: { userId, deletedAt: null },
          orderBy: { awardedAt: 'desc' },
          take: 10,
        }),
        prisma.follow.findMany({
          where: { followeeId: userId, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { follower: { select: { username: true, displayName: true } } },
        }),
      ])
      type Ev = { type: string; summary: string; createdAt: Date; meta: Record<string, unknown> }
      const events: Ev[] = []
      for (const s of subs) {
        events.push({
          type: 'submission',
          summary: `Published on ${s.challenge.title}`,
          createdAt: s.submittedAt ?? s.createdAt,
          meta: { submissionId: s.id, slug: s.challenge.slug },
        })
      }
      for (const b of badges) {
        events.push({
          type: 'badge',
          summary: `Earned badge ${b.type}`,
          createdAt: b.awardedAt,
          meta: { badgeType: b.type },
        })
      }
      for (const f of follows) {
        events.push({
          type: 'follow',
          summary: `${f.follower.displayName} (@${f.follower.username}) followed you`,
          createdAt: f.createdAt,
          meta: { followerId: f.followerId },
        })
      }
      events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return {
        items: events.slice(skip, skip + limit),
        total: events.length,
        page,
        limit,
      }
    },

    async pinSubmission(userId: string, submissionId: string) {
      const count = await prisma.userPinnedSubmission.count({
        where: { userId, deletedAt: null },
      })
      if (count >= 3) {
        throw Object.assign(new Error('Max 3 pinned submissions'), { statusCode: 400 })
      }
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, status: 'PUBLISHED', deletedAt: null },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (sub.testScore !== 100) {
        throw Object.assign(new Error('Only perfect scores can be pinned'), { statusCode: 400 })
      }
      await prisma.userPinnedSubmission.upsert({
        where: { userId_submissionId: { userId, submissionId } },
        create: { userId, submissionId, sortOrder: count },
        update: { deletedAt: null, sortOrder: count },
      })
      return { ok: true as const }
    },

    async unpinSubmission(userId: string, submissionId: string) {
      await prisma.userPinnedSubmission.updateMany({
        where: { userId, submissionId, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      return { ok: true as const }
    },
  }
}
