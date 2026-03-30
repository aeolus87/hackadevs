import type { PrismaClient, RepEventType } from '@prisma/client'

export type AwardRepMeta = {
  submissionId?: string
  challengeId?: string
  category?: import('@prisma/client').Categories
  note?: string
}

export async function awardRep(
  prisma: PrismaClient,
  userId: string,
  type: RepEventType,
  amount: number,
  meta: AwardRepMeta = {},
) {
  return prisma.$transaction(async (tx) => {
    await tx.repEvent.create({
      data: {
        userId,
        type,
        amount,
        submissionId: meta.submissionId,
        challengeId: meta.challengeId,
        category: meta.category,
        note: meta.note ?? null,
      },
    })
    await tx.user.update({
      where: { id: userId },
      data: { totalRep: { increment: amount } },
    })
  })
}

export async function revokeRep(
  prisma: PrismaClient,
  userId: string,
  submissionId: string,
  reason: string,
  amount: number,
) {
  return awardRep(prisma, userId, 'REVERSAL', -Math.abs(amount), {
    submissionId,
    note: reason,
  })
}
