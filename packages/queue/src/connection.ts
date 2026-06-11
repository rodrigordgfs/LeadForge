import { parseEnv } from "@leadforge/shared";

export interface RedisConnectionOptions {
  url: string;
  maxRetriesPerRequest: null;
}

let sharedConnectionOptions: RedisConnectionOptions | undefined;

export function createRedisConnectionOptions(
  redisUrl?: string,
): RedisConnectionOptions {
  const env = redisUrl
    ? parseEnv({ ...process.env, REDIS_URL: redisUrl })
    : parseEnv(process.env);

  if (!env.success) {
    throw new Error(`Invalid environment configuration: ${env.error.message}`);
  }

  return {
    url: env.data.REDIS_URL,
    maxRetriesPerRequest: null,
  };
}

export function getRedisConnectionOptions(): RedisConnectionOptions {
  if (!sharedConnectionOptions) {
    sharedConnectionOptions = createRedisConnectionOptions();
  }
  return sharedConnectionOptions;
}

export function resetRedisConnection(): void {
  sharedConnectionOptions = undefined;
}
