import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { Type } from '@sinclair/typebox'

const HealthResponseSchema = Type.Object({
  status: Type.Literal('ok'),
  timestamp: Type.String(),
})

export const apiRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
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
}
