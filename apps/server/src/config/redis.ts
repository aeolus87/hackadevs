import { Redis as IoRedis } from 'ioredis'

export function createRedisConnection(url: string) {
  return new IoRedis(url, { maxRetriesPerRequest: null })
}
