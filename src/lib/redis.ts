import { Redis } from "@upstash/redis";

// Upstash Redis client configuration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default redis;

// Redis utility functions
export const redisUtils = {
  async get(key: string) {
    try {
      const value = await redis.get(key);
      return value;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  },

  async set(key: string, value: unknown, expireInSeconds?: number) {
    try {
      if (expireInSeconds) {
        await redis.setex(key, expireInSeconds, value);
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  },

  async del(key: string) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error("Redis DEL error:", error);
      return false;
    }
  },

  async exists(key: string) {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Redis EXISTS error:", error);
      return false;
    }
  },

  async hget(key: string, field: string) {
    try {
      const value = await redis.hget(key, field);
      return value;
    } catch (error) {
      console.error("Redis HGET error:", error);
      return null;
    }
  },

  async hset(key: string, field: string, value: unknown) {
    try {
      await redis.hset(key, { [field]: value });
      return true;
    } catch (error) {
      console.error("Redis HSET error:", error);
      return false;
    }
  },

  async hgetall(key: string) {
    try {
      const value = await redis.hgetall(key);
      return value;
    } catch (error) {
      console.error("Redis HGETALL error:", error);
      return null;
    }
  },

  async lpush(key: string, ...values: unknown[]) {
    try {
      await redis.lpush(key, ...values);
      return true;
    } catch (error) {
      console.error("Redis LPUSH error:", error);
      return false;
    }
  },

  async rpop(key: string) {
    try {
      const value = await redis.rpop(key);
      return value;
    } catch (error) {
      console.error("Redis RPOP error:", error);
      return null;
    }
  },

  async llen(key: string) {
    try {
      const length = await redis.llen(key);
      return length;
    } catch (error) {
      console.error("Redis LLEN error:", error);
      return 0;
    }
  },

  async expire(key: string, seconds: number) {
    try {
      await redis.expire(key, seconds);
      return true;
    } catch (error) {
      console.error("Redis EXPIRE error:", error);
      return false;
    }
  },

  async ttl(key: string) {
    try {
      const ttl = await redis.ttl(key);
      return ttl;
    } catch (error) {
      console.error("Redis TTL error:", error);
      return -1;
    }
  },
};
