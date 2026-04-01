import type { ChallengeStatus, PrismaClient } from '@prisma/client'
import { generateChallenge } from '../../integrations/openai.client.js'
import { slugify } from '../../utils/slugify.js'
import { awardRep, revokeRep } from '../rep/rep.service.js'
import type {
  AdminPatchChallengeBody,
  GenerateChallengeBody,
  ModerationPatchBody,
} from './admin.schema.js'

export function createAdminService(prisma: PrismaClient) {
  return {
    async listModerationQueue(page: number, limit: number) {
      const skip = (page - 1) * limit
      const where = { status: 'FLAGGED' as const, deletedAt: null }
      const [items, total] = await Promise.all([
        prisma.submission.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            challenge: { select: { title: true, slug: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.submission.count({ where }),
      ])
      return { items, total, page, limit }
    },

    async applyModeration(submissionId: string, moderatorId: string, body: ModerationPatchBody) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, deletedAt: null },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      await prisma.moderationLog.create({
        data: {
          moderatorId,
          targetType: 'SUBMISSION',
          targetId: submissionId,
          action: body.action,
          reason: body.reason,
          note: body.note ?? null,
        },
      })
      if (body.action === 'APPROVED') {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PUBLISHED' },
        })
        return { ok: true as const }
      }
      if (body.action === 'REJECTED') {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'WITHDRAWN' },
        })
        await revokeRep(prisma, sub.userId, submissionId, body.reason, sub.challenge.category)
        return { ok: true as const }
      }
      if (body.action === 'WARNED') {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'PUBLISHED' },
        })
        return { ok: true as const }
      }
      if (body.action === 'BANNED') {
        const u = await prisma.user.findFirst({ where: { id: sub.userId } })
        if (u && u.totalRep > 0) {
          await awardRep(prisma, sub.userId, 'MANUAL_ADJUSTMENT', -u.totalRep, {
            note: `ban:${body.reason}`,
          })
        }
        await prisma.user.update({
          where: { id: sub.userId },
          data: { isBanned: true, banReason: body.reason },
        })
        return { ok: true as const }
      }
      return { ok: true as const }
    },

    async generateDraftChallenge(body: GenerateChallengeBody, adminId: string) {
      const gen = await generateChallenge(body.theme, body.category)
      const opensAt = new Date(Date.now() + 86400000)
      const closesAt = new Date(Date.now() + 8 * 86400000)
      const placeholderTests = [{ input: '', expectedOutput: '', isVisible: true }]
      return prisma.challenge.create({
        data: {
          slug: slugify(gen.title),
          title: gen.title,
          problemStatement: gen.problemStatement,
          constraints: [...gen.constraints],
          bonusObjective: gen.bonusObjective,
          exampleInput: gen.exampleInput,
          exampleOutput: gen.exampleOutput,
          tags: gen.tags,
          category: body.category,
          difficulty: gen.estimatedDifficulty,
          weekTheme: body.theme,
          opensAt,
          closesAt,
          testSuite: placeholderTests,
          status: 'DRAFT',
          createdByAdminId: adminId,
        },
      })
    },

    async listRepEvents(userId: string) {
      return prisma.repEvent.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500,
      })
    },

    async analytics() {
      const startDay = new Date()
      startDay.setUTCHours(0, 0, 0, 0)
      const weekAgo = new Date(Date.now() - 7 * 86400000)
      const dauRows = await prisma.submission.findMany({
        where: { createdAt: { gte: startDay }, deletedAt: null },
        distinct: ['userId'],
        select: { userId: true },
      })
      const weeklyRows = await prisma.submission.findMany({
        where: { createdAt: { gte: weekAgo }, deletedAt: null },
        distinct: ['userId'],
        select: { userId: true },
      })
      const submissionsToday = await prisma.submission.count({
        where: {
          createdAt: { gte: startDay },
          deletedAt: null,
          status: { not: 'DRAFT' },
        },
      })
      const voteVoters = await prisma.vote.findMany({
        where: { createdAt: { gte: weekAgo }, deletedAt: null },
        distinct: ['voterId'],
        select: { voterId: true },
      })
      const weeklyActiveUsers = weeklyRows.length
      const voteParticipationRate =
        weeklyActiveUsers > 0 ? Math.round((voteVoters.length / weeklyActiveUsers) * 100) : 0
      const subsWeek = await prisma.submission.groupBy({
        by: ['challengeId'],
        where: { createdAt: { gte: weekAgo }, deletedAt: null },
        _count: true,
      })
      let topCategoryThisWeek = 'BACKEND' as import('@prisma/client').Categories
      if (subsWeek.length) {
        const top = [...subsWeek].sort((a, b) => b._count - a._count)[0]
        const ch = await prisma.challenge.findFirst({ where: { id: top.challengeId } })
        if (ch) topCategoryThisWeek = ch.category
      }
      return {
        dau: dauRows.length,
        weeklyActiveUsers,
        submissionsToday,
        voteParticipationRate,
        topCategoryThisWeek,
      }
    },

    async listChallengesForAdmin(status: ChallengeStatus | undefined, page: number, limit: number) {
      const st = status ?? 'DRAFT'
      const skip = (page - 1) * limit
      const where = { deletedAt: null, status: st }
      const [items, total] = await Promise.all([
        prisma.challenge.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.challenge.count({ where }),
      ])
      return { items, total, page, limit }
    },

    async getChallengeByIdAdmin(id: string) {
      return prisma.challenge.findFirst({
        where: { id, deletedAt: null },
      })
    },

    async patchChallengeAdmin(id: string, body: AdminPatchChallengeBody) {
      const ch = await prisma.challenge.findFirst({ where: { id, deletedAt: null } })
      if (!ch) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const nextStatus = body.status ?? ch.status
      const opensAt = body.opensAt != null ? new Date(body.opensAt) : ch.opensAt
      if (nextStatus === 'SCHEDULED' && opensAt.getTime() <= Date.now()) {
        throw Object.assign(new Error('opensAt must be in the future for SCHEDULED'), {
          statusCode: 400,
        })
      }
      const data: Record<string, unknown> = {}
      if (body.title != null) data.title = body.title
      if (body.problemStatement != null) data.problemStatement = body.problemStatement
      if (body.constraints != null) data.constraints = body.constraints
      if (body.bonusObjective !== undefined) data.bonusObjective = body.bonusObjective
      if (body.tags != null) data.tags = body.tags
      if (body.category != null) data.category = body.category
      if (body.difficulty != null) data.difficulty = body.difficulty
      if (body.weekTheme != null) data.weekTheme = body.weekTheme
      if (body.opensAt != null) data.opensAt = new Date(body.opensAt)
      if (body.closesAt != null) data.closesAt = new Date(body.closesAt)
      if (body.companySource !== undefined) data.companySource = body.companySource
      if (body.testSuite != null) data.testSuite = body.testSuite
      if (body.companyAttributionOptIn != null) {
        data.companyAttributionOptIn = body.companyAttributionOptIn
      }
      if (body.status != null) data.status = body.status
      return prisma.challenge.update({
        where: { id },
        data: data as object,
      })
    },

    async softDeleteChallengeAdmin(id: string) {
      const ch = await prisma.challenge.findFirst({ where: { id, deletedAt: null } })
      if (!ch) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (ch.status !== 'DRAFT' && ch.status !== 'SCHEDULED') {
        throw Object.assign(new Error('only_draft_or_scheduled'), { statusCode: 400 })
      }
      return prisma.challenge.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    },

    async approveCompanyPortal(portalId: string) {
      const p = await prisma.companyPortal.findFirst({
        where: { id: portalId, deletedAt: null },
      })
      if (!p) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      return prisma.companyPortal.update({
        where: { id: portalId },
        data: { isApproved: true },
      })
    },
  }
}
