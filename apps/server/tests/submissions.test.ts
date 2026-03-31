import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'
import { prisma } from '../src/lib/prisma.js'
import { createSubmissionsService } from '../src/modules/submissions/submissions.service.js'
import { testServerEnv, testJwtSecret } from './test-env.js'

const dbReady = process.env.VITEST_DB_READY === '1'

describe.skipIf(!dbReady)('submissions routes', () => {
  it('GET /api/v1/submissions/challenge/x returns paginated shape', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: testJwtSecret,
      env: testServerEnv,
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/submissions/challenge/c1',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { success: boolean; data: unknown[] }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    await app.close()
  })
})

describe.skipIf(!dbReady)('submissions integration', () => {
  it('saveDraft upserts on same user and challenge', async () => {
    const user = await prisma.user.create({
      data: {
        email: `su-${Date.now()}@t.com`,
        username: `su${Date.now()}`,
        passwordHash: 'x',
        displayName: 'U',
      },
    })
    const ch = await prisma.challenge.create({
      data: {
        slug: `su-${Date.now()}`,
        title: 'T',
        problemStatement: 'p',
        constraints: ['c'],
        tags: ['x'],
        category: 'BACKEND',
        difficulty: 'BEGINNER',
        weekTheme: 'w',
        status: 'ACTIVE',
        opensAt: new Date(Date.now() - 3600000),
        closesAt: new Date(Date.now() + 86400000),
        testSuite: [{ input: '', expectedOutput: '', isVisible: true }],
      },
    })
    const svc = createSubmissionsService(prisma, {})
    const a = await svc.saveDraft(user.id, {
      challengeId: ch.id,
      code: 'a',
      language: 'TS',
      rationaleApproach: '',
      rationaleTradeoffs: '',
      rationaleScale: '',
      selfTags: [],
      selfDifficultyRating: 3,
    })
    const b = await svc.saveDraft(user.id, {
      challengeId: ch.id,
      code: 'b',
      language: 'TS',
      rationaleApproach: '',
      rationaleTradeoffs: '',
      rationaleScale: '',
      selfTags: [],
      selfDifficultyRating: 3,
    })
    expect(b.id).toBe(a.id)
    await prisma.submission.deleteMany({ where: { userId: user.id } })
    await prisma.challenge.delete({ where: { id: ch.id } })
    await prisma.user.delete({ where: { id: user.id } })
  })
})
