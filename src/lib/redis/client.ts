import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export { redis }

// Cache helper functions
export const cache = {
  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    return data as T | null
  },

  // Set data in cache with expiration (seconds)
  async set<T>(key: string, data: T, expiresIn: number = 300): Promise<void> {
    await redis.set(key, JSON.stringify(data), { ex: expiresIn })
  },

  // Delete from cache
  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}
