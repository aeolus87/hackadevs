import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'

describe('submissions routes', () => {
  it('GET /api/v1/submissions/challenge/x returns paginated shape', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: 'test-jwt-secret-16chars',
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/submissions/challenge/c1',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { challengeId: string; items: unknown[] }
    expect(body.challengeId).toBe('c1')
    expect(Array.isArray(body.items)).toBe(true)
    await app.close()
  })
})
