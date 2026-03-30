import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { apiRoutes } from '../src/api-routes.js'

describe('challenges routes', () => {
  it('GET /api/v1/challenges returns list envelope', async () => {
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: 'test-jwt-secret-16chars',
    })
    const res = await app.inject({ method: 'GET', url: '/api/v1/challenges' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { items: unknown[]; page: number }
    expect(Array.isArray(body.items)).toBe(true)
    await app.close()
  })
})
