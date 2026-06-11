import Redis from "ioredis";

import { parseEnv } from "../schemas/env.js";

export function getRedisUrl(redisUrl?: string): string {
  const env = redisUrl
    ? parseEnv({ ...process.env, REDIS_URL: redisUrl })
    : parseEnv(process.env);

  if (!env.success) {
    throw new Error(`Invalid environment configuration: ${env.error.message}`);
  }

  return env.data.REDIS_URL;
}

export function createRedisClient(redisUrl?: string): Redis {
  return new Redis(getRedisUrl(redisUrl), {
    maxRetriesPerRequest: null,
  });
}
