import type { PrismaClient } from '@prisma/client'
import type { RunWithPollingResult } from '../../integrations/judge0.client.js'
import { createJudge0Client } from '../../integrations/judge0.client.js'
import { scoreRationale } from '../../integrations/openai.client.js'
import { recordSubmissionStreak } from '../../utils/streakEngine.js'
import { createNotification } from '../notifications/notifications.service.js'
import type { SaveDraftBody } from './submissions.schema.js'

export type SubmissionsDeps = {
  judge0Url?: string
  judge0Key?: string
}

type TestSuiteItem = { input: string; expectedOutput: string; isVisible: boolean }

function parseSuite(raw: unknown): TestSuiteItem[] {
  if (!Array.isArray(raw)) return []
  return raw as TestSuiteItem[]
}

async function runSuite(
  judge0: ReturnType<typeof createJudge0Client>,
  code: string,
  language: import('@prisma/client').SubmissionLanguage,
  suite: TestSuiteItem[],
): Promise<{ results: RunWithPollingResult[]; executionTimeMs: number; testScore: number }> {
  const results: RunWithPollingResult[] = []
  let maxMs = 0
  for (const t of suite) {
    const r = await judge0.runWithPolling({
      code,
      language,
      stdin: t.input,
      expectedOutput: t.expectedOutput,
    })
    results.push(r)
    if (r.executionTimeMs > maxMs) maxMs = r.executionTimeMs
  }
  const passed = results.filter((x) => x.passed).length
  const testScore = suite.length === 0 ? 0 : (passed / suite.length) * 100
  return { results, executionTimeMs: maxMs, testScore }
}

export function createSubmissionsService(prisma: PrismaClient, deps: SubmissionsDeps) {
  const judge0 = deps.judge0Url != null ? createJudge0Client(deps.judge0Url, deps.judge0Key) : null

  return {
    async saveDraft(userId: string, data: SaveDraftBody) {
      const now = new Date()
      const ch = await prisma.challenge.findFirst({
        where: { id: data.challengeId, deletedAt: null },
      })
      if (!ch || ch.status !== 'ACTIVE' || ch.closesAt <= now) {
        throw Object.assign(new Error('challenge_not_available'), { statusCode: 400 })
      }
      return prisma.submission.upsert({
        where: { userId_challengeId: { userId, challengeId: data.challengeId } },
        create: {
          userId,
          challengeId: data.challengeId,
          code: data.code,
          language: data.language,
          rationaleApproach: data.rationaleApproach,
          rationaleTradeoffs: data.rationaleTradeoffs,
          rationaleScale: data.rationaleScale,
          selfTags: data.selfTags,
          selfDifficultyRating: data.selfDifficultyRating,
          status: 'DRAFT',
        },
        update: {
          code: data.code,
          language: data.language,
          rationaleApproach: data.rationaleApproach,
          rationaleTradeoffs: data.rationaleTradeoffs,
          rationaleScale: data.rationaleScale,
          selfTags: data.selfTags,
          selfDifficultyRating: data.selfDifficultyRating,
        },
      })
    },

    async runTests(submissionId: string, userId: string) {
      if (!judge0) throw Object.assign(new Error('judge0_unconfigured'), { statusCode: 503 })
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const fullSuite = parseSuite(sub.challenge.testSuite)
      const visibleSuite = fullSuite.filter((t) => t.isVisible === true)
      if (visibleSuite.length === 0) {
        throw Object.assign(
          new Error(
            'No visible test cases for this challenge. Draft runs cannot execute hidden tests.',
          ),
          { statusCode: 422 },
        )
      }
      const { results, executionTimeMs, testScore } = await runSuite(
        judge0,
        sub.code,
        sub.language,
        visibleSuite,
      )
      const memoryUsedMb = results.reduce((m, r) => Math.max(m, r.memoryUsedMb), 0)
      await prisma.submission.update({
        where: { id: submissionId },
        data: { testScore, executionTimeMs, memoryUsedMb },
      })
      return { results, executionTimeMs, testScore }
    },

    async submitSolution(submissionId: string, userId: string) {
      if (!judge0) throw Object.assign(new Error('judge0_unconfigured'), { statusCode: 503 })
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const ch = sub.challenge
      const now = new Date()
      if (ch.status !== 'ACTIVE' || ch.closesAt <= now) {
        throw Object.assign(new Error('challenge_closed'), { statusCode: 400 })
      }
      if (['SUBMITTED', 'EVALUATED', 'PUBLISHED'].includes(sub.status)) {
        throw Object.assign(new Error('already_submitted'), { statusCode: 409 })
      }
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'SUBMITTED', submittedAt: now },
      })
      const suite = parseSuite(ch.testSuite)
      const { results, executionTimeMs, testScore } = await runSuite(
        judge0,
        sub.code,
        sub.language,
        suite,
      )
      const passed = results.filter((r) => r.passed).length
      const mem = results.reduce((m, r) => Math.max(m, r.memoryUsedMb), 0)
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          testScore,
          testsPassedCount: passed,
          testsTotalCount: suite.length,
          executionTimeMs,
          memoryUsedMb: mem,
        },
      })
      if (testScore < 50) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'EVALUATED' },
        })
        return {
          status: 'EVALUATED' as const,
          testScore,
          message: 'Score too low to publish. You may not resubmit.',
        }
      }
      let rationaleScore = 0
      let summary = ''
      let flags: string[] = []
      let clarity = 0
      let depth = 0
      let honesty = 0
      let scalability = 0
      const scored = await scoreRationale({
        approach: sub.rationaleApproach,
        tradeoffs: sub.rationaleTradeoffs,
        scale: sub.rationaleScale,
        challengeTitle: ch.title,
      })
      clarity = scored.clarity
      depth = scored.depth
      honesty = scored.honesty
      scalability = scored.scalability
      rationaleScore = clarity + depth + honesty + scalability
      summary = scored.summary
      flags = scored.flags
      if (flags.includes('score_failed')) {
        rationaleScore = 0
        summary = 'Scoring unavailable'
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            rationaleClarity: 0,
            rationaleDepth: 0,
            rationaleHonesty: 0,
            rationaleScalability: 0,
            rationaleScore: null,
            rationaleSummary: summary,
            rationaleFlags: flags,
          },
        })
      } else {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            rationaleClarity: clarity,
            rationaleDepth: depth,
            rationaleHonesty: honesty,
            rationaleScalability: scalability,
            rationaleScore,
            rationaleSummary: summary,
            rationaleFlags: flags,
          },
        })
      }
      if (flags.includes('likely_ai_generated') && !flags.includes('score_failed')) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: 'FLAGGED' },
        })
        await createNotification(
          prisma,
          userId,
          'SOLUTION_FEATURED',
          'Your submission is under review',
          'Our moderation team is reviewing your submission. This usually takes under 24 hours.',
          { submissionId },
        )
        const mods = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'MODERATOR'] }, deletedAt: null },
          select: { id: true },
        })
        for (const m of mods) {
          await createNotification(
            prisma,
            m.id,
            'SOLUTION_FEATURED',
            'Moderation queue',
            `Submission ${submissionId} flagged for review.`,
            { submissionId },
          )
        }
        const mod = await prisma.user.findFirst({
          where: { role: 'ADMIN', deletedAt: null },
          select: { id: true },
        })
        if (mod) {
          await prisma.moderationLog.create({
            data: {
              moderatorId: mod.id,
              targetType: 'SUBMISSION',
              targetId: submissionId,
              action: 'ESCALATED',
              reason: 'likely_ai_generated',
            },
          })
        }
        return { status: 'FLAGGED' as const, message: 'Your submission is under review.' }
      }
      await prisma.submission.update({
        where: { id: submissionId },
        data: { status: 'PUBLISHED' },
      })
      await prisma.challenge.update({
        where: { id: ch.id },
        data: { submissionCount: { increment: 1 } },
      })
      await prisma.categoryRep.upsert({
        where: { userId_category: { userId, category: ch.category } },
        create: { userId, category: ch.category, rep: 0 },
        update: {},
      })
      const u = await prisma.user.findFirst({ where: { id: userId } })
      if (u) {
        const tick = recordSubmissionStreak({
          currentStreakDays: u.currentStreakDays,
          longestStreakDays: u.longestStreakDays,
          lastSubmissionDate: u.lastSubmissionDate,
          now,
          streakGracesRemaining: u.streakGracesRemaining,
        })
        await prisma.user.update({
          where: { id: userId },
          data: {
            currentStreakDays: tick.current,
            longestStreakDays: tick.longest,
            streakGracesRemaining: tick.gracesRemaining,
            lastSubmissionDate: now,
          },
        })
        const streakMilestones = [
          { n: 7, type: 'STREAK_7' as const },
          { n: 30, type: 'STREAK_30' as const },
          { n: 100, type: 'STREAK_100' as const },
        ]
        for (const m of streakMilestones) {
          if (tick.current === m.n) {
            const exists = await prisma.badge.findFirst({
              where: { userId, type: m.type, deletedAt: null },
            })
            if (!exists) {
              await prisma.badge.create({
                data: { userId, type: m.type },
              })
              await createNotification(
                prisma,
                userId,
                'BADGE_EARNED',
                `${m.n}-day streak!`,
                `You've maintained a ${m.n}-day solving streak. Keep going.`,
                { streakDays: String(m.n) },
              )
            }
          }
        }
      }
      return prisma.submission.findFirst({
        where: { id: submissionId },
        include: { challenge: true },
      })
    },

    async getSubmissionsByChallenge(challengeId: string, page: number, limit: number) {
      const skip = (page - 1) * limit
      const where = {
        challengeId,
        status: 'PUBLISHED' as const,
        deletedAt: null,
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
      return { items, total, page, limit }
    },

    async getOwnSubmission(userId: string, challengeId: string) {
      return prisma.submission.findFirst({
        where: { userId, challengeId, deletedAt: null },
        include: { challenge: true },
      })
    },

    async getSubmission(submissionId: string, requestingUserId: string | null) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, deletedAt: null },
        include: { challenge: true, user: true },
      })
      if (!sub) return null
      if (sub.userId === requestingUserId) return sub
      if (sub.status === 'PUBLISHED') return sub
      return null
    },

    async softDeleteDraft(submissionId: string, userId: string) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, status: 'DRAFT' },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      return prisma.submission.update({
        where: { id: submissionId },
        data: { deletedAt: new Date() },
      })
    },
  }
}
