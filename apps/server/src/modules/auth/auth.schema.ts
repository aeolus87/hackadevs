import { z } from 'zod'

export const registerBodySchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-z0-9_]+$/i),
  password: z.string().min(10),
  displayName: z.string().min(1).max(80),
})

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
