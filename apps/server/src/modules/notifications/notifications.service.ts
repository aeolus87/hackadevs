import type { Prisma, PrismaClient, NotificationType } from '@prisma/client'

export async function createNotification(
  prisma: PrismaClient,
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function listNotifications(
  prisma: PrismaClient,
  userId: string,
  page: number,
  limit: number,
) {
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId, deletedAt: null } }),
  ])
  return { items, total }
}

export async function markNotificationRead(prisma: PrismaClient, userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId, deletedAt: null },
    data: { isRead: true },
  })
}

export async function markAllNotificationsRead(prisma: PrismaClient, userId: string) {
  return prisma.notification.updateMany({
    where: { userId, deletedAt: null },
    data: { isRead: true },
  })
}
