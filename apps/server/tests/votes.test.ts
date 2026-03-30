import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'

describe('votes routes', () => {
  it('GET /api/v1/votes/submission/s1 returns counts', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: 'test-jwt-secret-16chars',
    })
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/votes/submission/s1',
    })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { up: number; down: number }
    expect(body.up).toBe(0)
    expect(body.down).toBe(0)
    await app.close()
  })
})
