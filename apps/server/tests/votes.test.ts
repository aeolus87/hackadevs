import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'
import { prisma } from '../src/lib/prisma.js'
import { createVotesService } from '../src/modules/votes/votes.service.js'
import { signAccessToken } from '../src/modules/auth/auth.service.js'
import { testServerEnv, testJwtSecret } from './test-env.js'

const dbReady = process.env.VITEST_DB_READY === '1'

async function closedChallenge() {
  return prisma.challenge.create({
    data: {
      slug: `v-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: 'T',
      problemStatement: 'p',
      constraints: ['c'],
      tags: ['x'],
      category: 'BACKEND',
      difficulty: 'BEGINNER',
      weekTheme: 'w',
      status: 'CLOSED',
      opensAt: new Date(Date.now() - 7200000),
      closesAt: new Date(Date.now() - 3600000),
      testSuite: [{ input: '', expectedOutput: '', isVisible: true }],
    },
  })
}

describe.skipIf(!dbReady)('votes routes', () => {
  it('GET /api/v1/votes/submission/s1 returns counts envelope', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: testServerEnv.JWT_SECRET,
      env: testServerEnv,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/votes/submission/s1',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as {
      success: boolean
      data: { upvoteCount: number; downvoteCount: number }
    }
    expect(body.success).toBe(true)
    expect(body.data.upvoteCount).toBe(0)
    expect(body.data.downvoteCount).toBe(0)
    await app.close()
  })
})

describe.skipIf(!dbReady)('votes integration', () => {
  it('eligibility, own submission, valid vote, retract, duplicate, late retract', async () => {
    const votes = createVotesService(prisma)
    const owner = await prisma.user.create({
      data: {
        email: `vo-${Date.now()}@t.com`,
        username: `vo${Date.now()}`,
        passwordHash: 'x',
        displayName: 'O',
        createdAt: new Date(Date.now() - 8 * 86400000),
      },
    })
    const voterNew = await prisma.user.create({
      data: {
        email: `vn-${Date.now()}@t.com`,
        username: `vn${Date.now()}`,
        passwordHash: 'x',
        displayName: 'N',
        createdAt: new Date(),
      },
    })
    const voterOk = await prisma.user.create({
      data: {
        email: `vk-${Date.now()}@t.com`,
        username: `vk${Date.now()}`,
        passwordHash: 'x',
        displayName: 'K',
        createdAt: new Date(Date.now() - 8 * 86400000),
      },
    })
    const ch = await closedChallenge()
    const chAct = await closedChallenge()
    const sub = await prisma.submission.create({
      data: {
        userId: owner.id,
        challengeId: ch.id,
        code: 'c',
        language: 'TS',
        rationaleApproach: '',
        rationaleTradeoffs: '',
        rationaleScale: '',
        selfTags: [],
        selfDifficultyRating: 3,
        status: 'PUBLISHED',
        submittedAt: new Date(),
        rationaleScore: 80,
        testScore: 100,
      },
    })
    await prisma.submission.create({
      data: {
        userId: voterOk.id,
        challengeId: chAct.id,
        code: 'x',
        language: 'TS',
        rationaleApproach: '',
        rationaleTradeoffs: '',
        rationaleScale: '',
        selfTags: [],
        selfDifficultyRating: 3,
        status: 'PUBLISHED',
        submittedAt: new Date(),
        rationaleScore: 80,
        testScore: 100,
      },
    })
    await expect(
      votes.castVote(voterNew.id, { submissionId: sub.id, value: 'UP' }),
    ).rejects.toMatchObject({ statusCode: 403 })
    await expect(
      votes.castVote(owner.id, { submissionId: sub.id, value: 'UP' }),
    ).rejects.toMatchObject({ statusCode: 403 })
    await votes.castVote(voterOk.id, { submissionId: sub.id, value: 'UP' })
    const row = await prisma.submission.findFirst({ where: { id: sub.id } })
    expect(row?.upvoteCount).toBeGreaterThanOrEqual(1)
    await votes.retractVote(voterOk.id, sub.id)
    await votes.castVote(voterOk.id, { submissionId: sub.id, value: 'UP' })
    await expect(
      votes.castVote(voterOk.id, { submissionId: sub.id, value: 'DOWN' }),
    ).rejects.toMatchObject({ statusCode: 409 })
    const v = await prisma.vote.findFirst({
      where: { voterId: voterOk.id, submissionId: sub.id },
    })
    expect(v).toBeTruthy()
    await prisma.vote.update({
      where: { id: v!.id },
      data: { createdAt: new Date(Date.now() - 400000) },
    })
    await expect(votes.retractVote(voterOk.id, sub.id)).rejects.toMatchObject({
      statusCode: 403,
    })
    await prisma.vote.deleteMany({ where: { submissionId: sub.id } })
    await prisma.submission.deleteMany({ where: { challengeId: { in: [ch.id, chAct.id] } } })
    await prisma.challenge.deleteMany({ where: { id: { in: [ch.id, chAct.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, voterNew.id, voterOk.id] } } })
  })

  it('HTTP duplicate vote returns 409', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: testServerEnv.JWT_SECRET,
      env: testServerEnv,
    })
    const owner = await prisma.user.create({
      data: {
        email: `ht-${Date.now()}@t.com`,
        username: `hto${Date.now()}`,
        passwordHash: 'x',
        displayName: 'O',
        createdAt: new Date(Date.now() - 8 * 86400000),
      },
    })
    const voter = await prisma.user.create({
      data: {
        email: `htv-${Date.now()}@t.com`,
        username: `htv${Date.now()}`,
        passwordHash: 'x',
        displayName: 'V',
        createdAt: new Date(Date.now() - 8 * 86400000),
      },
    })
    const ch = await closedChallenge()
    const chAct = await closedChallenge()
    const sub = await prisma.submission.create({
      data: {
        userId: owner.id,
        challengeId: ch.id,
        code: 'c',
        language: 'TS',
        rationaleApproach: '',
        rationaleTradeoffs: '',
        rationaleScale: '',
        selfTags: [],
        selfDifficultyRating: 3,
        status: 'PUBLISHED',
        submittedAt: new Date(),
        rationaleScore: 80,
        testScore: 100,
      },
    })
    await prisma.submission.create({
      data: {
        userId: voter.id,
        challengeId: chAct.id,
        code: 'x',
        language: 'TS',
        rationaleApproach: '',
        rationaleTradeoffs: '',
        rationaleScale: '',
        selfTags: [],
        selfDifficultyRating: 3,
        status: 'PUBLISHED',
        submittedAt: new Date(),
        rationaleScore: 80,
        testScore: 100,
      },
    })
    const token = signAccessToken(testJwtSecret, voter.id, voter.username, 'USER')
    await app.inject({
      method: 'POST',
      url: '/api/v1/votes',
      headers: { authorization: `Bearer ${token}` },
      payload: { submissionId: sub.id, value: 'UP' },
    })
    const dup = await app.inject({
      method: 'POST',
      url: '/api/v1/votes',
      headers: { authorization: `Bearer ${token}` },
      payload: { submissionId: sub.id, value: 'UP' },
    })
    expect(dup.statusCode).toBe(409)
    await prisma.vote.deleteMany({ where: { submissionId: sub.id } })
    await prisma.submission.deleteMany({ where: { challengeId: { in: [ch.id, chAct.id] } } })
    await prisma.challenge.deleteMany({ where: { id: { in: [ch.id, chAct.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, voter.id] } } })
    await app.close()
  })
})
