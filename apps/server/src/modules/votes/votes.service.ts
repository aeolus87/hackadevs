import type { PrismaClient } from '@prisma/client'
import { calculateWeightedVoteScore } from '../../utils/repEngine.js'
import { createNotification } from '../notifications/notifications.service.js'
import type { CastVoteBody } from './votes.schema.js'

async function recalcSubmissionVotes(prisma: PrismaClient, submissionId: string) {
  const rows = await prisma.vote.findMany({
    where: { submissionId, deletedAt: null },
    select: { value: true, voterRepAtTime: true },
  })
  const { voteScore, upvoteCount, downvoteCount } = calculateWeightedVoteScore(rows)
  await prisma.submission.update({
    where: { id: submissionId },
    data: { upvoteCount, downvoteCount, voteScore },
  })
}

export function createVotesService(prisma: PrismaClient) {
  return {
    async castVote(voterId: string, body: CastVoteBody) {
      const voter = await prisma.user.findFirst({
        where: { id: voterId, deletedAt: null },
      })
      if (!voter) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      const ageMs = Date.now() - voter.createdAt.getTime()
      if (ageMs < 7 * 86400000) {
        throw Object.assign(new Error('Account too new to vote'), { statusCode: 403 })
      }
      const since = new Date(Date.now() - 30 * 86400000)
      const recentSubmission = await prisma.submission.findFirst({
        where: {
          userId: voterId,
          status: 'PUBLISHED',
          submittedAt: { gte: since },
          deletedAt: null,
        },
      })
      if (!recentSubmission) {
        throw Object.assign(
          new Error('Must have a published solution in the last 30 days to vote'),
          { statusCode: 403 },
        )
      }
      const sub = await prisma.submission.findFirst({
        where: { id: body.submissionId, deletedAt: null },
        include: { challenge: true, user: true },
      })
      if (!sub) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (sub.userId === voterId) {
        throw Object.assign(new Error('Cannot vote on own submission'), { statusCode: 403 })
      }
      const now = new Date()
      const close = sub.challenge.closesAt.getTime()
      const endVote = close + 48 * 3600000
      if (now.getTime() <= close || now.getTime() >= endVote) {
        throw Object.assign(new Error('Voting closed'), { statusCode: 403 })
      }
      const existing = await prisma.vote.findFirst({
        where: { voterId, submissionId: body.submissionId, deletedAt: null },
      })
      if (existing) {
        throw Object.assign(new Error('Already voted'), { statusCode: 409 })
      }
      await prisma.vote.create({
        data: {
          voterId,
          submissionId: body.submissionId,
          value: body.value,
          voterRepAtTime: voter.totalRep,
        },
      })
      await recalcSubmissionVotes(prisma, body.submissionId)
      await createNotification(
        prisma,
        sub.userId,
        'VOTE_RECEIVED',
        'Someone voted on your solution',
        `Your solution for "${sub.challenge.title}" received a ${body.value === 'UP' ? '👍' : '👎'} vote.`,
        { submissionId: body.submissionId, challengeId: sub.challengeId },
      )
      return { ok: true as const }
    },

    async retractVote(voterId: string, submissionId: string) {
      const v = await prisma.vote.findFirst({
        where: { voterId, submissionId, deletedAt: null },
      })
      if (!v) throw Object.assign(new Error('not_found'), { statusCode: 404 })
      if (Date.now() - v.createdAt.getTime() > 300000) {
        throw Object.assign(new Error('Retract window closed'), { statusCode: 403 })
      }
      await prisma.vote.delete({ where: { id: v.id } })
      await recalcSubmissionVotes(prisma, submissionId)
      return { ok: true as const }
    },

    async getVoteCounts(submissionId: string, requestingUserId: string | null) {
      const sub = await prisma.submission.findFirst({
        where: { id: submissionId, deletedAt: null },
      })
      if (!sub) return null
      let userVote: 'UP' | 'DOWN' | null = null
      if (requestingUserId) {
        const v = await prisma.vote.findFirst({
          where: { voterId: requestingUserId, submissionId, deletedAt: null },
        })
        userVote = v?.value ?? null
      }
      return {
        upvoteCount: sub.upvoteCount,
        downvoteCount: sub.downvoteCount,
        userVote,
      }
    },
  }
}
