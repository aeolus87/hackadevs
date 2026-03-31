import type { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Prisma } from '@prisma/client'

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, _request, reply) => {
    if (reply.sent) return

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const meta = error.meta?.target
        const field = Array.isArray(meta) ? meta.join(', ') : String(meta ?? 'field')
        return reply.status(409).send({ success: false, message: `${field} already exists` })
      }
      if (error.code === 'P2025') {
        return reply.status(404).send({ success: false, message: 'Record not found' })
      }
      fastify.log.error(error)
      return reply.status(500).send({ success: false, message: 'Database error' })
    }

    const status = (error as { statusCode?: number }).statusCode

    if (status === 400) {
      return reply.status(400).send({ success: false, message: error.message })
    }
    if (status === 401) {
      return reply.status(401).send({ success: false, message: 'Unauthorised' })
    }
    if (status === 403) {
      return reply.status(403).send({ success: false, message: error.message || 'Forbidden' })
    }
    if (status === 404) {
      return reply.status(404).send({ success: false, message: error.message || 'Not found' })
    }
    if (status === 409) {
      return reply.status(409).send({ success: false, message: error.message || 'Conflict' })
    }

    fastify.log.error(error)
    return reply.status(500).send({ success: false, message: 'Internal server error' })
  })
}

export default fp(errorHandlerPlugin)
