import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env['UPSTASH_REDIS_REST_URL'],
  token: process.env['UPSTASH_REDIS_REST_TOKEN']
});

export async function rateLimit(identifier: string, limit = 100) {
  const key = `rate_limit:${identifier}`;
  const count = await redis.incr(key);
  
  if (count === 1) await redis.expire(key, 3600);
  
  return {
    success: count <= limit,
    remaining: Math.max(0, limit - count)
  };
}
