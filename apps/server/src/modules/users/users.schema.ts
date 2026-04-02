import { z } from 'zod'

const emptyToNull = (v: unknown) => (v === '' ? null : v)
const emptyToUndef = (v: unknown) => (v === '' ? undefined : v)

const optionalHttpUrl = z.preprocess(emptyToNull, z.union([z.null(), z.string().url()]).optional())

const avatarPatch = z.preprocess(
  (v) => (v === '' ? null : v),
  z
    .union([
      z.null(),
      z
        .string()
        .max(200000)
        .refine(
          (val) =>
            /^https?:\/\//i.test(val) || /^data:image\/(png|jpeg|gif|webp);base64,/i.test(val),
          { message: 'Invalid avatar URL' },
        ),
    ])
    .optional(),
)

export const patchMeSchema = z.object({
  displayName: z.preprocess(emptyToUndef, z.string().min(1).optional()),
  tagline: z.string().max(120).optional(),
  avatarUrl: avatarPatch,
  githubUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  websiteUrl: optionalHttpUrl,
  twitterUrl: optionalHttpUrl,
  selfDeclaredLevel: z.enum(['JUNIOR', 'MID', 'SENIOR']).optional(),
  availabilityStatus: z
    .enum(['UNSPECIFIED', 'OPEN_TO_WORK', 'EMPLOYED', 'NOT_LOOKING', 'FREELANCE_OPEN'])
    .optional(),
})

export type PatchMeBody = z.infer<typeof patchMeSchema>

const allowedAvatarContentTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const avatarUploadSchema = z.object({
  filename: z.string().min(1).max(512),
  contentType: z.enum(allowedAvatarContentTypes),
})

export type AvatarUploadBody = z.infer<typeof avatarUploadSchema>
