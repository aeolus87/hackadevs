import type { Prisma, PrismaClient } from '@prisma/client'
import { assignRanks } from '../../utils/rankingEngine.js'
import { slugify } from '../../utils/slugify.js'
import { awardPreliminaryRep } from '../rep/rep.service.js'
import { createNotification } from '../notifications/notifications.service.js'
import type {
  CreateChallengeInput,
  ListChallengesQuery,
  UpdateChallengeInput,
} from './challenges.schema.js'

export type TestSuiteItem = { input: string; expectedOutput: string; isVisible: boolean }

function filterTestSuite(suite: unknown, includeHidden: boolean): TestSuiteItem[] {
  if (!Array.isArray(suite)) return []
  const arr = suite as TestSuiteItem[]
  if (includeHidden) return arr
  return arr.filter((t) => t.isVisible)
}

export async function createChallenge(
  prisma: PrismaClient,
  data: CreateChallengeInput,
  adminId: string,
) {
  const slug = slugify(data.title)
  return prisma.challenge.create({
    data: {
      slug,
      title: data.title,
      problemStatement: data.problemStatement,
      constraints: data.constraints,
      bonusObjective: data.bonusObjective ?? null,
      tags: data.tags,
      category: data.category,
      difficulty: data.difficulty,
      weekTheme: data.weekTheme,
      opensAt: new Date(data.opensAt),
      closesAt: new Date(data.closesAt),
      companySource: data.companySource ?? null,
      testSuite: data.testSuite as object[],
      createdByAdminId: adminId,
      status: 'DRAFT',
    },
  })
}

export async function listChallenges(prisma: PrismaClient, params: ListChallengesQuery) {
  const { page, limit, status, category, difficulty, tag } = params
  const where: Prisma.ChallengeWhereInput = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  }
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.challenge.findMany({
      where,
      orderBy: { opensAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.challenge.count({ where }),
  ])
  return { items, total, page, limit }
}

export async function listActiveChallenges(prisma: PrismaClient) {
  const now = new Date()
  return prisma.challenge.findMany({
    where: {
      deletedAt: null,
      status: 'ACTIVE',
      opensAt: { lte: now },
      closesAt: { gt: now },
    },
    orderBy: { closesAt: 'asc' },
  })
}

export async function getChallengeBySlug(
  prisma: PrismaClient,
  slug: string,
  includeHiddenTests = false,
) {
  const ch = await prisma.challenge.findFirst({
    where: { slug, deletedAt: null },
  })
  if (!ch) return null
  const testSuite = filterTestSuite(ch.testSuite, includeHiddenTests)
  return { ...ch, testSuite }
}

export async function updateChallenge(
  prisma: PrismaClient,
  id: string,
  data: UpdateChallengeInput,
) {
  const patch: Record<string, unknown> = {}
  if (data.title != null) patch.title = data.title
  if (data.problemStatement != null) patch.problemStatement = data.problemStatement
  if (data.constraints != null) patch.constraints = data.constraints
  if (data.bonusObjective !== undefined) patch.bonusObjective = data.bonusObjective
  if (data.tags != null) patch.tags = data.tags
  if (data.category != null) patch.category = data.category
  if (data.difficulty != null) patch.difficulty = data.difficulty
  if (data.weekTheme != null) patch.weekTheme = data.weekTheme
  if (data.opensAt != null) patch.opensAt = new Date(data.opensAt)
  if (data.closesAt != null) patch.closesAt = new Date(data.closesAt)
  if (data.companySource !== undefined) patch.companySource = data.companySource
  if (data.testSuite != null) patch.testSuite = data.testSuite as object[]
  return prisma.challenge.update({
    where: { id },
    data: patch as object,
  })
}

export async function softDeleteChallenge(prisma: PrismaClient, id: string) {
  return prisma.challenge.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export async function publishChallenge(prisma: PrismaClient, id: string) {
  const ch = await prisma.challenge.findFirst({ where: { id, deletedAt: null } })
  if (!ch) return null
  if (ch.status !== 'SCHEDULED' && ch.status !== 'DRAFT') return ch
  const now = new Date()
  const opensAt = ch.opensAt.getTime() > now.getTime() ? ch.opensAt : now
  return prisma.challenge.update({
    where: { id },
    data: { status: 'ACTIVE', opensAt },
  })
}

export async function closeChallenge(prisma: PrismaClient, id: string) {
  const ch = await prisma.challenge.findFirst({
    where: { id, deletedAt: null },
    include: {
      submissions: {
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          OR: [
            { verificationStatus: null },
            { verificationStatus: 'PASSED' },
            { verificationStatus: 'SKIPPED' },
          ],
        },
      },
    },
  })
  if (!ch) return null
  if (ch.status === 'CLOSED') {
    return prisma.challenge.findFirst({ where: { id } })
  }
  if (ch.status !== 'ACTIVE') {
    return null
  }
  const transition = await prisma.challenge.updateMany({
    where: { id, status: 'ACTIVE', deletedAt: null },
    data: { status: 'CLOSED' },
  })
  if (transition.count === 0) {
    return prisma.challenge.findFirst({ where: { id } })
  }
  const closingParticipants = await prisma.submission.findMany({
    where: {
      challengeId: id,
      deletedAt: null,
      status: { in: ['DRAFT', 'SUBMITTED', 'AWAITING_FOLLOWUP', 'EVALUATED', 'PUBLISHED'] },
    },
    distinct: ['userId'],
    select: { userId: true },
  })
  for (const { userId } of closingParticipants) {
    await createNotification(
      prisma,
      userId,
      'CHALLENGE_CLOSING',
      `Challenge closed: ${ch.title}`,
      'The submission window has ended. Check the challenge for voting and final results.',
      { challengeId: id },
    )
  }
  const published = ch.submissions
  const forRank = published.map((s) => ({
    id: s.id,
    compositeScore: (s.testScore ?? 0) * 0.4 + (s.rationaleScore ?? 0) * 0.35,
    rationaleScore: s.rationaleScore ?? 0,
    submittedAt: s.submittedAt ?? s.createdAt,
  }))
  const rankMap = assignRanks(forRank)
  const userIds = [...new Set(published.map((s) => s.userId))]
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, currentStreakDays: true },
  })
  const streakByUserId = Object.fromEntries(users.map((u) => [u.id, u.currentStreakDays]))
  const rankedSubs = published.map((s) => ({
    id: s.id,
    userId: s.userId,
    rank: rankMap.get(s.id) ?? 1,
    difficulty: ch.difficulty,
    submittedAt: s.submittedAt ?? s.createdAt,
    testScore: s.testScore ?? 0,
    rationaleScore: s.rationaleScore ?? 0,
  }))
  for (const s of published) {
    const r = rankMap.get(s.id)
    if (r != null) {
      await prisma.submission.update({
        where: { id: s.id },
        data: {
          preliminaryRank: r,
          compositeScore: (s.testScore ?? 0) * 0.4 + (s.rationaleScore ?? 0) * 0.35,
        },
      })
      await createNotification(
        prisma,
        s.userId,
        'RANK_CHANGE',
        'Challenge closed — your preliminary rank',
        `You ranked #${r} in "${ch.title}". Final rank after voting.`,
        { submissionId: s.id, challengeId: ch.id },
      )
    }
  }
  await awardPreliminaryRep(prisma, rankedSubs, ch, streakByUserId)
  const count = await prisma.submission.count({
    where: {
      challengeId: id,
      status: 'PUBLISHED',
      deletedAt: null,
      OR: [
        { verificationStatus: null },
        { verificationStatus: 'PASSED' },
        { verificationStatus: 'SKIPPED' },
      ],
    },
  })
  await prisma.challenge.update({
    where: { id },
    data: { submissionCount: count },
  })
  return prisma.challenge.findFirst({ where: { id } })
}

export async function getChallengeLeaderboard(
  prisma: PrismaClient,
  slug: string,
  page: number,
  limit: number,
) {
  const ch = await prisma.challenge.findFirst({
    where: {
      slug,
      deletedAt: null,
      status: { in: ['CLOSED', 'ARCHIVED'] },
    },
  })
  if (!ch) return null
  const skip = (page - 1) * limit
  const where: Prisma.SubmissionWhereInput = {
    challengeId: ch.id,
    status: 'PUBLISHED',
    deletedAt: null,
    OR: [
      { verificationStatus: null },
      { verificationStatus: 'PASSED' },
      { verificationStatus: 'SKIPPED' },
    ],
  }
  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
            tier: true,
            globalRank: true,
          },
        },
      },
      orderBy: [{ compositeScore: 'desc' }, { submittedAt: 'asc' }],
      skip,
      take: limit,
    }),
    prisma.submission.count({ where }),
  ])
  return { challenge: ch, items, total, page, limit }
}
