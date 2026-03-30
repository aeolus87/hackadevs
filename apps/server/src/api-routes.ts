import type { FastifyPluginAsync } from 'fastify'
import { Type } from '@sinclair/typebox'
import { createV1Routes } from './modules/v1/v1.routes.js'

const HealthResponseSchema = Type.Object({
  status: Type.Literal('ok'),
  timestamp: Type.String(),
})

export type ApiRouteOpts = {
  jwtSecret: string
}

export const apiRoutes: FastifyPluginAsync<ApiRouteOpts> = async (fastify, opts) => {
  const jwtSecret = opts.jwtSecret

  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    async () => ({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    }),
  )

  await fastify.register(createV1Routes(jwtSecret), { prefix: '/v1' })
}
