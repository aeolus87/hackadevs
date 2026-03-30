import type { FastifyPluginAsync } from 'fastify'
import type { PrismaClient } from '@prisma/client'
import { buildAuthController } from './auth.controller.js'

export function createAuthRoutes(prisma: PrismaClient, jwtSecret: string): FastifyPluginAsync {
  const c = buildAuthController(prisma, jwtSecret)
  return async (f) => {
    f.post('/register', (req, reply) => c.register(req, reply))
    f.post('/login', (req, reply) => c.login(req, reply))
    f.post('/github', (req, reply) => c.github(req, reply))
    f.post('/refresh', (req, reply) => c.refresh(req, reply))
    f.post('/logout', (req, reply) => c.logout(req, reply))
  }
}
