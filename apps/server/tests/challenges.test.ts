import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'
import { prisma } from '../src/lib/prisma.js'
import {
  createChallenge,
  getChallengeBySlug,
} from '../src/modules/challenges/challenges.service.js'
import { testServerEnv, testJwtSecret } from './test-env.js'

const dbReady = process.env.VITEST_DB_READY === '1'

describe.skipIf(!dbReady)('challenges routes', () => {
  it('GET /api/v1/challenges returns paginated api envelope', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: testJwtSecret,
      env: testServerEnv,
    })
    const res = await app.inject({ method: 'GET', url: '/api/v1/challenges' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { success: boolean; data: unknown[]; page: number }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    await app.close()
  })
})

describe.skipIf(!dbReady)('challenges integration', () => {
  it('creates challenge with slug, filters hidden tests, transitions status', async () => {
    const admin = await prisma.user.create({
      data: {
        email: `adm-${Date.now()}@t.com`,
        username: `adm${Date.now()}`,
        passwordHash: 'x',
        displayName: 'Admin',
        role: 'ADMIN',
      },
    })
    const ch = await createChallenge(
      prisma,
      {
        title: 'Test Challenge',
        problemStatement: 'Do X',
        constraints: ['c1'],
        tags: ['t1'],
        category: 'BACKEND',
        difficulty: 'MEDIUM',
        weekTheme: 'test',
        opensAt: new Date(Date.now() + 3600000).toISOString(),
        closesAt: new Date(Date.now() + 7200000).toISOString(),
        testSuite: [
          { input: '1', expectedOutput: '1', isVisible: true },
          { input: '2', expectedOutput: '2', isVisible: false },
        ],
      },
      admin.id,
    )
    expect(ch.slug).toMatch(/test-challenge-/)
    const pub = await getChallengeBySlug(prisma, ch.slug, false)
    expect(pub?.testSuite).toHaveLength(1)
    await prisma.challenge.update({
      where: { id: ch.id },
      data: { status: 'SCHEDULED' },
    })
    let row = await prisma.challenge.findFirst({ where: { id: ch.id } })
    expect(row?.status).toBe('SCHEDULED')
    await prisma.challenge.update({
      where: { id: ch.id },
      data: { status: 'ACTIVE' },
    })
    row = await prisma.challenge.findFirst({ where: { id: ch.id } })
    expect(row?.status).toBe('ACTIVE')
    await prisma.challenge.update({
      where: { id: ch.id },
      data: { status: 'CLOSED' },
    })
    row = await prisma.challenge.findFirst({ where: { id: ch.id } })
    expect(row?.status).toBe('CLOSED')
    await prisma.challenge.delete({ where: { id: ch.id } })
    await prisma.user.delete({ where: { id: admin.id } })
  })
})
