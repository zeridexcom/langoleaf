import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export { redis };

const isRedisEnabled = !!redis;

// Cache helper functions
export const cache = {
  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisEnabled || !redis) return null;
    try {
      const data = await redis.get(key);
      if (typeof data === "string") {
        try {
          return JSON.parse(data) as T;
        } catch {
          return null;
        }
      }
      return data as T | null;
    } catch (error) {
      console.error("Redis get failed:", error);
      return null;
    }
  },

  // Set data in cache with expiration (seconds)
  async set<T>(key: string, data: T, expiresIn: number = 300): Promise<void> {
    if (!isRedisEnabled || !redis) return;
    try {
      await redis.set(key, JSON.stringify(data), { ex: expiresIn });
    } catch (error) {
      console.error("Redis set failed:", error);
    }
  },

  // Delete from cache
  async del(key: string): Promise<void> {
    if (!isRedisEnabled || !redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Redis del failed:", error);
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    if (!isRedisEnabled || !redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Redis delPattern failed:", error);
    }
  },
};
