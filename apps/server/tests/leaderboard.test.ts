import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'
import { testServerEnv, testJwtSecret } from './test-env.js'

const dbReady = process.env.VITEST_DB_READY === '1'

describe.skipIf(!dbReady)('leaderboard routes', () => {
  it('GET /api/v1/leaderboard/global returns items', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: testJwtSecret,
      env: testServerEnv,
    })
    const res = await app.inject({ method: 'GET', url: '/api/v1/leaderboard/global' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { success: boolean; data: unknown[] }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    await app.close()
  })
})
