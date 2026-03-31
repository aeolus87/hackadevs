import type { FastifyReply } from 'fastify'

export type ApiSuccess<T> = { success: true; data: T; message?: string }

export type ApiPaginated<T> = {
  success: true
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export type ApiErrorBody = { success: false; message: string; code?: string }

export function sendSuccess<T>(reply: FastifyReply, data: T, message?: string, status = 200) {
  const body: ApiSuccess<T> = message ? { success: true, data, message } : { success: true, data }
  return reply.code(status).send(body)
}

export function sendPaginated<T>(
  reply: FastifyReply,
  data: T[],
  total: number,
  page: number,
  limit: number,
  status = 200,
) {
  const body: ApiPaginated<T> = {
    success: true,
    data,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  }
  return reply.code(status).send(body)
}

export function sendError(reply: FastifyReply, status: number, message: string, code?: string) {
  const body: ApiErrorBody = code ? { success: false, message, code } : { success: false, message }
  return reply.code(status).send(body)
}
