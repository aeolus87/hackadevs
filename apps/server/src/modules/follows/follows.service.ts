import type { PrismaClient } from '@prisma/client'
import { createNotification } from '../notifications/notifications.service.js'

export function createFollowsService(prisma: PrismaClient) {
  return {
    async follow(followerId: string, followeeUsername: string) {
      const followee = await prisma.user.findFirst({
        where: { username: followeeUsername.toLowerCase(), deletedAt: null },
      })
      if (!followee) throw Object.assign(new Error('User not found'), { statusCode: 404 })
      if (followee.id === followerId) {
        throw Object.assign(new Error('Cannot follow yourself'), { statusCode: 400 })
      }
      const existing = await prisma.follow.findFirst({
        where: { followerId, followeeId: followee.id },
      })
      if (existing) {
        if (existing.deletedAt) {
          await prisma.follow.update({
            where: { id: existing.id },
            data: { deletedAt: null },
          })
        }
      } else {
        await prisma.follow.create({
          data: { followerId, followeeId: followee.id },
        })
      }
      const follower = await prisma.user.findFirst({
        where: { id: followerId, deletedAt: null },
        select: { username: true, displayName: true },
      })
      await createNotification(
        prisma,
        followee.id,
        'FOLLOWED',
        'New follower',
        follower
          ? `${follower.displayName} (@${follower.username}) started following you.`
          : 'Someone started following you.',
        { followerId, username: follower?.username },
      )
      return { ok: true as const }
    },

    async unfollow(followerId: string, followeeUsername: string) {
      const followee = await prisma.user.findFirst({
        where: { username: followeeUsername.toLowerCase(), deletedAt: null },
      })
      if (!followee) return { ok: true as const }
      await prisma.follow.updateMany({
        where: { followerId, followeeId: followee.id, deletedAt: null },
        data: { deletedAt: new Date() },
      })
      return { ok: true as const }
    },

    async getFollowers(username: string, page: number, limit: number) {
      const u = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), deletedAt: null },
      })
      if (!u) return null
      const skip = (page - 1) * limit
      const where = { followeeId: u.id, deletedAt: null }
      const [follows, total] = await Promise.all([
        prisma.follow.findMany({
          where,
          include: {
            follower: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                tier: true,
                globalRank: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.follow.count({ where }),
      ])
      return {
        items: follows.map((f) => f.follower),
        total,
        page,
        limit,
      }
    },

    async getFollowing(username: string, page: number, limit: number) {
      const u = await prisma.user.findFirst({
        where: { username: username.toLowerCase(), deletedAt: null },
      })
      if (!u) return null
      const skip = (page - 1) * limit
      const where = { followerId: u.id, deletedAt: null }
      const [follows, total] = await Promise.all([
        prisma.follow.findMany({
          where,
          include: {
            followee: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                tier: true,
                globalRank: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.follow.count({ where }),
      ])
      return {
        items: follows.map((f) => f.followee),
        total,
        page,
        limit,
      }
    },
  }
}
