import type { FastifyPluginAsync } from 'fastify'
import oauth2 from '@fastify/oauth2'
import type { PrismaClient } from '@prisma/client'
import type { ServerEnv } from '@hackadevs/config'
import { findUserByEmail } from '../modules/auth/auth.model.js'
import { issueRefreshTokenPair, signAccessToken } from '../modules/auth/auth.service.js'

type GhUser = {
  id: number
  login: string
  name: string | null
  html_url: string
  avatar_url: string
}

type GhEmail = { email: string; primary: boolean; verified: boolean }

async function fetchGithubJson<T>(url: string, accessToken: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'hackadevs-server',
    },
  })
  if (!res.ok) {
    throw Object.assign(new Error('github_api_failed'), { statusCode: 502 })
  }
  return res.json() as Promise<T>
}

function sanitizeGithubLogin(login: string): string {
  const s = login
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
  return s.slice(0, 24) || 'github_user'
}

async function allocateUsername(prisma: PrismaClient, base: string): Promise<string> {
  const root = sanitizeGithubLogin(base)
  for (let n = 0; n < 50; n++) {
    const candidate = n === 0 ? root : `${root}_${n + 1}`
    const taken = await prisma.user.findFirst({
      where: { username: candidate, deletedAt: null },
    })
    if (!taken) return candidate
  }
  throw Object.assign(new Error('username_allocation_failed'), { statusCode: 500 })
}

async function resolveGithubEmail(accessToken: string): Promise<string> {
  const emails = await fetchGithubJson<GhEmail[]>('https://api.github.com/user/emails', accessToken)
  const primary = emails.find((e) => e.primary && e.verified)
  const anyVerified = emails.find((e) => e.verified)
  const email = primary?.email ?? anyVerified?.email ?? emails[0]?.email
  if (!email) {
    throw Object.assign(new Error('github_email_required'), { statusCode: 400 })
  }
  return email.toLowerCase()
}

export type GithubOauthOpts = {
  prisma: PrismaClient
  jwtSecret: string
  env: ServerEnv
}

export const githubOauthPlugin: FastifyPluginAsync<GithubOauthOpts> = async (fastify, opts) => {
  const { prisma, jwtSecret, env } = opts
  const id = env.GITHUB_CLIENT_ID
  const secret = env.GITHUB_CLIENT_SECRET
  const callbackUri = env.GITHUB_CALLBACK_URL
  if (!id?.length || !secret?.length || !callbackUri?.length) {
    return
  }

  const githubAuth = {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizeHost: 'https://github.com',
    authorizePath: '/login/oauth/authorize',
  }

  await fastify.register(oauth2, {
    name: 'githubOAuth2',
    scope: ['read:user', 'user:email', 'read:org'],
    credentials: {
      client: { id, secret },
      auth: githubAuth,
    },
    startRedirectPath: '/auth/github',
    callbackUri,
  })

  fastify.get('/auth/github/callback', async (request, reply) => {
    try {
      const flow = await fastify.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)
      const accessToken = flow.token.access_token
      if (!accessToken) {
        throw Object.assign(new Error('github_token_missing'), { statusCode: 502 })
      }
      const gh = await fetchGithubJson<GhUser>('https://api.github.com/user', accessToken)
      const email = await resolveGithubEmail(accessToken)
      const githubId = String(gh.id)

      const byGh = await prisma.user.findFirst({
        where: { githubId, deletedAt: null },
      })
      if (byGh) {
        await prisma.user.update({
          where: { id: byGh.id },
          data: {
            githubAccessToken: accessToken,
            avatarUrl: gh.avatar_url,
            githubUrl: gh.html_url,
          },
        })
        const token = signAccessToken(jwtSecret, byGh.id, byGh.username, byGh.role)
        const { refreshToken } = await issueRefreshTokenPair(prisma, byGh.id)
        return reply.redirect(
          `${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken)}`,
        )
      }

      const byEmail = await findUserByEmail(prisma, email)
      if (byEmail && !byEmail.githubId) {
        await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            githubId,
            githubAccessToken: accessToken,
            githubUrl: gh.html_url,
            avatarUrl: byEmail.avatarUrl ?? gh.avatar_url,
          },
        })
        const token = signAccessToken(jwtSecret, byEmail.id, byEmail.username, byEmail.role)
        const { refreshToken } = await issueRefreshTokenPair(prisma, byEmail.id)
        return reply.redirect(
          `${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken)}`,
        )
      }

      if (byEmail && byEmail.githubId && byEmail.githubId !== githubId) {
        throw Object.assign(new Error('email_linked_other_github'), { statusCode: 409 })
      }

      const username = await allocateUsername(prisma, gh.login)
      const displayName = (gh.name ?? gh.login).slice(0, 80)
      const created = await prisma.user.create({
        data: {
          username,
          email,
          displayName,
          githubId,
          githubAccessToken: accessToken,
          githubUrl: gh.html_url,
          avatarUrl: gh.avatar_url,
          passwordHash: null,
        },
      })
      const token = signAccessToken(jwtSecret, created.id, created.username, created.role)
      const { refreshToken } = await issueRefreshTokenPair(prisma, created.id)
      return reply.redirect(
        `${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&refresh=${encodeURIComponent(refreshToken)}`,
      )
    } catch (err) {
      const e = err as { statusCode?: number }
      const q =
        e.statusCode === 409
          ? 'account_conflict'
          : e.statusCode === 400
            ? 'email_required'
            : 'oauth_failed'
      return reply.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(q)}`)
    }
  })
}

declare module 'fastify' {
  interface FastifyInstance {
    githubOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: import('fastify').FastifyRequest,
      ) => Promise<{ token: { access_token: string } }>
    }
  }
}
