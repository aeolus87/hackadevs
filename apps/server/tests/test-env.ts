import { parseServerEnv } from '@hackadevs/config'

export const testServerEnv = parseServerEnv({
  NODE_ENV: 'test',
  JWT_SECRET: 'test-jwt-secret-16chars',
})

export const testJwtSecret = testServerEnv.JWT_SECRET ?? 'test-jwt-secret-16chars'
