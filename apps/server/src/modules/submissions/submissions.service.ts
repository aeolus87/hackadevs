import { Prisma, type Challenge, type PrismaClient } from '@prisma/client'
import type { RunWithPollingResult } from '../../integrations/judge0.client.js'
import { createJudge0Client } from '../../integrations/judge0.client.js'
import {
  generateFollowUpQuestions,
  scoreRationale,
  scoreVerificationAnswers,
} from '../../integrations/openai.client.js'
import { recordSubmissionStreak } from '../../utils/streakEngine.js'
import { revokeRep } from '../rep/rep.service.js'
import { createNotification } from '../notifications/notifications.service.js'
import type {
  CompleteFollowUpBody,
  SaveDraftBody,
  VerifyAnswersBody,
} from './submissions.schema.js'

export type SubmissionsDeps = {
  judge0Url?: string
  judge0Key?: string
}

type TestSuiteItem = { input: string; expectedOutput: string; isVisible: boolean }

function trimRunDetail(text: string | null | undefined, max = 2000): string | undefined {
  if (text == null) return undefined
  const t = text.trim()
  if (!t) return undefined
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

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

  async function finalizePublishSubmission(
    submissionId: string,
    userId: string,
    ch: Pick<Challenge, 'id' | 'category'>,
    now: Date,
  ) {
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
  }

  return {
    async saveDraft(userId: string, data: SaveDraftBody) {
      const now = new Date()
      const ch = await prisma.challenge.findFirst({
        where: { id: data.challengeId, deletedAt: null },
      })
      if (!ch || ch.status !== 'ACTIVE' || ch.closesAt <= now) {
        throw Object.assign(new Error('challenge_not_available'), { statusCode: 400 })
      }
      const existing = await prisma.submission.findFirst({
        where: { userId, challengeId: data.challengeId, deletedAt: null },
      })
      const draftPayload = {
        code: data.code,
        language: data.language,
        rationaleApproach: data.rationaleApproach,
        rationaleTradeoffs: data.rationaleTradeoffs,
        rationaleScale: data.rationaleScale,
        selfTags: data.selfTags,
        selfDifficultyRating: data.selfDifficultyRating,
      }
      if (existing) {
        if (existing.status === 'WITHDRAWN') {
          return prisma.submission.update({
            where: { id: existing.id },
            data: {
              ...draftPayload,
              status: 'DRAFT',
              testScore: null,
              testsPassedCount: null,
              testsTotalCount: null,
              rationaleScore: null,
              rationaleClarity: null,
              rationaleDepth: null,
              rationaleHonesty: null,
              rationaleScalability: null,
              rationaleSummary: null,
              rationaleFlags: [],
              voteScore: null,
              upvoteCount: 0,
              downvoteCount: 0,
              compositeScore: null,
              preliminaryRank: null,
              finalRank: null,
              repAwarded: null,
              executionTimeMs: null,
              memoryUsedMb: null,
              submittedAt: null,
              followUpQuestions: Prisma.DbNull,
              followUpAnswers: Prisma.DbNull,
              verificationQuestions: Prisma.DbNull,
              verificationStatus: null,
              verificationRetryCount: 0,
            },
          })
        }
        if (existing.status !== 'DRAFT') {
          throw Object.assign(new Error('already_submitted'), { statusCode: 409 })
        }
        return prisma.submission.update({
          where: { id: existing.id },
          data: draftPayload,
        })
      }
      return prisma.submission.create({
        data: {
          userId,
          challengeId: data.challengeId,
          ...draftPayload,
          status: 'DRAFT',
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
      return {
        results: results.map((r) => ({
          passed: r.passed,
          stdout: r.stdout,
          stderr: trimRunDetail(r.stderr),
          executionTimeMs: r.executionTimeMs,
          memoryUsedMb: r.memoryUsedMb,
        })),
        executionTimeMs,
        testScore,
      }
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
      if (sub.status !== 'DRAFT') {
        throw Object.assign(new Error('already_submitted'), { statusCode: 409 })
      }
      const suite = parseSuite(ch.testSuite)
      const { results, executionTimeMs, testScore } = await runSuite(
        judge0,
        sub.code,
        sub.language,
        suite,
      )
      const passed = results.filter((r) => r.passed).length
      const mem = results.reduce((m, r) => Math.max(m, r.memoryUsedMb), 0)
      if (testScore < 50) {
        const saved = await prisma.submission.updateMany({
          where: { id: submissionId, userId, status: 'DRAFT', deletedAt: null },
          data: {
            status: 'EVALUATED',
            submittedAt: now,
            testScore,
            testsPassedCount: passed,
            testsTotalCount: suite.length,
            executionTimeMs,
            memoryUsedMb: mem,
          },
        })
        if (saved.count === 0) {
          throw Object.assign(new Error('already_submitted'), { statusCode: 409 })
        }
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
      }
      const fq = await generateFollowUpQuestions({
        code: sub.code,
        language: sub.language,
        challengeTitle: ch.title,
        rationaleSummary: summary,
      })
      const rationalePayload = flags.includes('score_failed')
        ? {
            rationaleClarity: 0,
            rationaleDepth: 0,
            rationaleHonesty: 0,
            rationaleScalability: 0,
            rationaleScore: null as number | null,
            rationaleSummary: summary,
            rationaleFlags: flags,
          }
        : {
            rationaleClarity: clarity,
            rationaleDepth: depth,
            rationaleHonesty: honesty,
            rationaleScalability: scalability,
            rationaleScore,
            rationaleSummary: summary,
            rationaleFlags: flags,
          }
      const savedPending = await prisma.submission.updateMany({
        where: { id: submissionId, userId, status: 'DRAFT', deletedAt: null },
        data: {
          status: 'SUBMITTED',
          submittedAt: now,
          testScore,
          testsPassedCount: passed,
          testsTotalCount: suite.length,
          executionTimeMs,
          memoryUsedMb: mem,
          ...rationalePayload,
          verificationQuestions: fq.questions as unknown as Prisma.InputJsonValue,
          verificationStatus: 'PENDING',
          verificationRetryCount: 0,
        },
      })
      if (savedPending.count === 0) {
        throw Object.assign(new Error('already_submitted'), { statusCode: 409 })
      }
      return {
        status: 'AWAITING_VERIFICATION' as const,
        submissionId,
        questions: fq.questions.map((q) => q.prompt),
      }
    },

    async verifySubmissionAnswers(submissionId: string, userId: string, body: VerifyAnswersBody) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (sub.status !== 'SUBMITTED') {
        throw Object.assign(new Error('verify_not_pending'), { statusCode: 400 })
      }
      const vs = sub.verificationStatus
      if (vs !== 'PENDING' && vs !== 'RETRY') {
        throw Object.assign(new Error('verify_not_pending'), { statusCode: 400 })
      }
      const rawQ = sub.verificationQuestions
      if (!rawQ || !Array.isArray(rawQ)) {
        throw Object.assign(new Error('verify_questions_missing'), { statusCode: 500 })
      }
      const qs = rawQ as { id: string; prompt: string }[]
      if (qs.length !== 2) {
        throw Object.assign(new Error('verify_questions_missing'), { statusCode: 500 })
      }
      const qTexts = [qs[0].prompt, qs[1].prompt] as [string, string]
      const aTexts = [body.answers[0], body.answers[1]] as [string, string]
      const scored = await scoreVerificationAnswers({
        questions: qTexts,
        answers: aTexts,
        code: sub.code,
      })
      if (scored.kind === 'unavailable') {
        return {
          verified: false as const,
          unavailable: true as const,
          message:
            'Verification is temporarily unavailable. Your answers were not submitted. Please try again in a moment.',
        }
      }
      const now = new Date()
      if (scored.score >= 60) {
        await finalizePublishSubmission(submissionId, userId, sub.challenge, now)
        await prisma.submission.update({
          where: { id: submissionId },
          data: { verificationStatus: 'PASSED' },
        })
        return {
          verified: true as const,
          repAwarded: 0,
        }
      }
      if (sub.verificationRetryCount < 1) {
        await prisma.submission.update({
          where: { id: submissionId },
          data: {
            verificationRetryCount: 1,
            verificationStatus: 'RETRY',
          },
        })
        return {
          verified: false as const,
          canRetry: true as const,
          message: 'Your answers did not demonstrate sufficient understanding.',
        }
      }
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'EVALUATED',
          verificationStatus: 'FAILED',
        },
      })
      return {
        verified: false as const,
        canRetry: false as const,
        message: 'Your answers did not demonstrate sufficient understanding.',
      }
    },

    async resumeFlaggedToFollowUp(submissionId: string, userId: string) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null, status: 'FLAGGED' },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const ch = sub.challenge
      const now = new Date()
      if (ch.status !== 'ACTIVE' || ch.closesAt <= now) {
        throw Object.assign(new Error('challenge_closed'), { statusCode: 400 })
      }
      const fq = await generateFollowUpQuestions({
        code: sub.code,
        language: sub.language,
        challengeTitle: ch.title,
        rationaleSummary: sub.rationaleSummary ?? '',
      })
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          status: 'AWAITING_FOLLOWUP',
          followUpQuestions: fq.questions as unknown as Prisma.InputJsonValue,
        },
      })
      return {
        status: 'AWAITING_FOLLOWUP' as const,
        followUpQuestions: fq.questions,
      }
    },

    async withdrawPublishedForRevision(submissionId: string, userId: string) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null, status: 'PUBLISHED' },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const ch = sub.challenge
      const now = new Date()
      if (ch.status !== 'ACTIVE' || ch.closesAt <= now) {
        throw Object.assign(new Error('revision_window_closed'), { statusCode: 400 })
      }
      await revokeRep(prisma, userId, submissionId, 'withdrawn_for_revision', ch.category)
      const voteNow = new Date()
      await prisma.$transaction(async (tx) => {
        await tx.vote.updateMany({
          where: { submissionId, deletedAt: null },
          data: { deletedAt: voteNow },
        })
        const chRow = await tx.challenge.findUnique({
          where: { id: ch.id },
          select: { submissionCount: true },
        })
        if (chRow && chRow.submissionCount > 0) {
          await tx.challenge.update({
            where: { id: ch.id },
            data: { submissionCount: { decrement: 1 } },
          })
        }
        await tx.userPinnedSubmission.deleteMany({ where: { submissionId } })
        await tx.companyBookmark.updateMany({
          where: { submissionId, deletedAt: null },
          data: { deletedAt: voteNow },
        })
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            status: 'WITHDRAWN',
            submittedAt: null,
            testScore: null,
            testsPassedCount: null,
            testsTotalCount: null,
            rationaleScore: null,
            rationaleClarity: null,
            rationaleDepth: null,
            rationaleHonesty: null,
            rationaleScalability: null,
            rationaleSummary: null,
            rationaleFlags: [],
            voteScore: null,
            upvoteCount: 0,
            downvoteCount: 0,
            compositeScore: null,
            preliminaryRank: null,
            finalRank: null,
            repAwarded: null,
            executionTimeMs: null,
            memoryUsedMb: null,
            followUpQuestions: Prisma.DbNull,
            followUpAnswers: Prisma.DbNull,
            verificationQuestions: Prisma.DbNull,
            verificationStatus: null,
            verificationRetryCount: 0,
          },
        })
      })
      return prisma.submission.findFirst({
        where: { id: submissionId },
        include: { challenge: true },
      })
    },

    async completeFollowUp(submissionId: string, userId: string, body: CompleteFollowUpBody) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, userId, deletedAt: null },
        include: { challenge: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (sub.status !== 'AWAITING_FOLLOWUP') {
        throw Object.assign(new Error('follow_up_not_pending'), { statusCode: 400 })
      }
      const rawQ = sub.followUpQuestions
      if (!rawQ || !Array.isArray(rawQ)) {
        throw Object.assign(new Error('follow_up_invalid'), { statusCode: 500 })
      }
      const qs = rawQ as { id: string; prompt: string }[]
      if (body.answers.length !== qs.length) {
        throw Object.assign(new Error('follow_up_answer_count'), { statusCode: 400 })
      }
      const ids = new Set(qs.map((q) => q.id))
      for (const q of qs) {
        const a = body.answers.find((x) => x.id === q.id)
        const t = a?.text?.trim() ?? ''
        if (t.length < 15) {
          throw Object.assign(new Error('follow_up_answer_too_short'), { statusCode: 400 })
        }
      }
      for (const a of body.answers) {
        if (!ids.has(a.id)) {
          throw Object.assign(new Error('follow_up_unknown_question'), { statusCode: 400 })
        }
      }
      const now = new Date()
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          followUpAnswers: body.answers as unknown as Prisma.InputJsonValue,
        },
      })
      await finalizePublishSubmission(submissionId, userId, sub.challenge, now)
      await prisma.submission.update({
        where: { id: submissionId },
        data: { verificationStatus: 'SKIPPED' },
      })
      return prisma.submission.findFirst({
        where: { id: submissionId },
        include: { challenge: true },
      })
    },

    async getSubmissionsByChallenge(challengeId: string, page: number, limit: number) {
      const skip = (page - 1) * limit
      const where: Prisma.SubmissionWhereInput = {
        challengeId,
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
      if (sub.status !== 'PUBLISHED') return null
      const vs = sub.verificationStatus
      if (vs != null && vs !== 'PASSED' && vs !== 'SKIPPED') return null
      return sub
    },

    async getChallengeSubmissionStats(challengeId: string) {
      const where: Prisma.SubmissionWhereInput = {
        challengeId,
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [
          { verificationStatus: null },
          { verificationStatus: 'PASSED' },
          { verificationStatus: 'SKIPPED' },
        ],
      }
      const rows = await prisma.submission.findMany({
        where,
        select: {
          language: true,
          testScore: true,
          rationaleScore: true,
        },
      })
      const total = rows.length
      if (total === 0) {
        return {
          totalSubmissions: 0,
          languageDistribution: [] as { language: string; count: number; percentage: number }[],
          avgTestScore: 0,
          avgRationaleScore: 0,
        }
      }
      const byLang = new Map<string, number>()
      let testSum = 0
      let ratSum = 0
      let ratN = 0
      for (const r of rows) {
        byLang.set(r.language, (byLang.get(r.language) ?? 0) + 1)
        testSum += r.testScore ?? 0
        if (r.rationaleScore != null) {
          ratSum += r.rationaleScore
          ratN += 1
        }
      }
      const languageDistribution = [...byLang.entries()].map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / total) * 1000) / 10,
      }))
      return {
        totalSubmissions: total,
        languageDistribution,
        avgTestScore: Math.round((testSum / total) * 10) / 10,
        avgRationaleScore: ratN > 0 ? Math.round((ratSum / ratN) * 10) / 10 : 0,
      }
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
