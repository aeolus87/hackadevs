import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { parseServerEnv } from '@hackadevs/config'
import { apiRoutes } from './api-routes.js'
import errorHandlerPlugin from './plugins/error-handler.plugin.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
config({ path: path.join(repoRoot, '.env') })

let env: ReturnType<typeof parseServerEnv>
try {
  env = parseServerEnv()
} catch (err) {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
}

const fastify = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>()

async function start() {
  const cookieSecret = env.JWT_SECRET ?? 'development-jwt-secret-min-16-chars'

  await fastify.register(errorHandlerPlugin)
  await fastify.register(cookie, { secret: cookieSecret })
  await fastify.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  })

  await fastify.register(helmet, { contentSecurityPolicy: false })
  await fastify.register(apiRoutes, {
    prefix: '/api',
    jwtSecret: env.JWT_SECRET ?? 'development-jwt-secret-min-16-chars',
    env,
  })

  await fastify.listen({ port: env.PORT, host: '0.0.0.0' })
  fastify.log.info(`Server running at http://localhost:${env.PORT}`)

  if (env.REDIS_URL) {
    import('./jobs/bullmq.js')
      .then(({ startBackgroundJobs }) => startBackgroundJobs(env.REDIS_URL!, env))
      .catch((e) => fastify.log.error(e))
  }
}

start().catch((err) => {
  fastify.log.error(err)
  process.exit(1)
})
