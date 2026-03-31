import { describe, it, expect } from 'vitest'
import Fastify from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { parseServerEnv } from '@hackadevs/config'
import { apiRoutes } from './api-routes.js'

describe('GET /api/health', () => {
  it('returns typed health payload', async () => {
    const env = parseServerEnv({
      NODE_ENV: 'test',
      JWT_SECRET: 'unit-test-jwt-secret-16chars',
    })
    const app = Fastify().withTypeProvider<TypeBoxTypeProvider>()
    await app.register(apiRoutes, {
      prefix: '/api',
      jwtSecret: env.JWT_SECRET ?? 'unit-test-jwt-secret-16chars',
      env,
    })
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body) as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    await app.close()
  })
})
