import type { PrismaClient, Categories } from '@prisma/client'
import { getTierFromRep } from '../../utils/repEngine.js'

export type LeaderboardEntry = {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  totalRep: number
  globalRank: number | null
  tier: import('@prisma/client').UserTier
  weeklyRepDelta: number
  currentStreakDays: number
  bestCategory: Categories | null
  categoryRank: number | null
}

function bestCategoryFromReps(
  reps: { category: Categories; rep: number }[],
): { category: Categories; rep: number } | null {
  if (!reps.length) return null
  return [...reps].sort((a, b) => b.rep - a.rep)[0] ?? null
}

export function createLeaderboardService(prisma: PrismaClient) {
  return {
    async getGlobalLeaderboard(page: number, limit: number) {
      const skip = (page - 1) * limit
      const where = { deletedAt: null, isBanned: false }
      const [rows, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { categoryReps: { where: { deletedAt: null } } },
          orderBy: [{ totalRep: 'desc' }, { createdAt: 'asc' }],
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ])
      const items: LeaderboardEntry[] = rows.map((u) => {
        const best = bestCategoryFromReps(u.categoryReps)
        const bestRow =
          best == null ? null : (u.categoryReps.find((c) => c.category === best.category) ?? null)
        return {
          userId: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          totalRep: u.totalRep,
          globalRank: u.globalRank,
          tier: u.tier,
          weeklyRepDelta: u.weeklyRepDelta,
          currentStreakDays: u.currentStreakDays,
          bestCategory: best?.category ?? null,
          categoryRank: bestRow?.rank ?? null,
        }
      })
      return { items, total, page, limit }
    },

    async getCategoryLeaderboard(category: Categories, page: number, limit: number) {
      const skip = (page - 1) * limit
      const where = { category, deletedAt: null, user: { deletedAt: null, isBanned: false } }
      const [rows, total] = await Promise.all([
        prisma.categoryRep.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                totalRep: true,
                globalRank: true,
                tier: true,
                weeklyRepDelta: true,
                currentStreakDays: true,
              },
            },
          },
          orderBy: { rep: 'desc' },
          skip,
          take: limit,
        }),
        prisma.categoryRep.count({ where }),
      ])
      const items: LeaderboardEntry[] = rows.map((r, i) => ({
        userId: r.user.id,
        username: r.user.username,
        displayName: r.user.displayName,
        avatarUrl: r.user.avatarUrl,
        totalRep: r.user.totalRep,
        globalRank: r.user.globalRank,
        tier: r.user.tier,
        weeklyRepDelta: r.user.weeklyRepDelta,
        currentStreakDays: r.user.currentStreakDays,
        bestCategory: category,
        categoryRank: skip + i + 1,
      }))
      return { items, total, page, limit }
    },

    async getFriendsLeaderboard(userId: string) {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId, deletedAt: null },
        select: { followeeId: true },
        take: 200,
      })
      const ids = follows.map((f) => f.followeeId)
      if (!ids.length) return []
      const users = await prisma.user.findMany({
        where: { id: { in: ids }, deletedAt: null, isBanned: false },
        orderBy: { weeklyRepDelta: 'desc' },
        take: 50,
      })
      return users.map((u) => ({
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        totalRep: u.totalRep,
        globalRank: u.globalRank,
        tier: u.tier,
        weeklyRepDelta: u.weeklyRepDelta,
        currentStreakDays: u.currentStreakDays,
        bestCategory: null as Categories | null,
        categoryRank: null as number | null,
      }))
    },

    async getMyRank(userId: string) {
      const u = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: { categoryReps: { where: { deletedAt: null } } },
      })
      if (!u) return null
      return {
        globalRank: u.globalRank,
        weeklyDelta: u.weeklyRepDelta,
        categoryRanks: u.categoryReps.map((c) => ({
          category: c.category,
          rep: c.rep,
          rank: c.rank,
        })),
      }
    },

    async recomputeGlobalRanks() {
      const users = await prisma.user.findMany({
        where: { deletedAt: null, isBanned: false },
        orderBy: [{ totalRep: 'desc' }, { createdAt: 'asc' }],
        select: { id: true },
      })
      const chunk = 500
      for (let i = 0; i < users.length; i += chunk) {
        const slice = users.slice(i, i + chunk)
        if (slice.length === 0) continue
        await prisma.$transaction(
          slice.map((u, idx) =>
            prisma.user.update({
              where: { id: u.id },
              data: { globalRank: i + idx + 1 },
            }),
          ),
        )
      }
      const categories = [
        'BACKEND',
        'FRONTEND',
        'SYSTEM_DESIGN',
        'SECURITY',
        'DATA_ENGINEERING',
        'ML_OPS',
        'DEVOPS',
        'FULLSTACK',
      ] as Categories[]
      for (const cat of categories) {
        const reps = await prisma.categoryRep.findMany({
          where: { category: cat, deletedAt: null },
          orderBy: { rep: 'desc' },
          select: { id: true },
        })
        for (let j = 0; j < reps.length; j += chunk) {
          const sl = reps.slice(j, j + chunk)
          if (sl.length === 0) continue
          await prisma.$transaction(
            sl.map((r, idx) =>
              prisma.categoryRep.update({
                where: { id: r.id },
                data: { rank: j + idx + 1 },
              }),
            ),
          )
        }
      }
      const allUsers = await prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, totalRep: true },
      })
      for (let i = 0; i < allUsers.length; i += chunk) {
        const sl = allUsers.slice(i, i + chunk)
        if (sl.length === 0) continue
        await prisma.$transaction(
          sl.map((u) =>
            prisma.user.update({
              where: { id: u.id },
              data: { tier: getTierFromRep(u.totalRep) },
            }),
          ),
        )
      }
    },
  }
}
