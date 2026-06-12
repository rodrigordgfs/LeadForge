import type { Redis } from "ioredis";

import { createRedisClient } from "./redis-client.js";
import {
  serializeSseEvent,
  sseChannelName,
  type SseEvent,
} from "./sse.js";

let publisherClient: Redis | undefined;

export function createSsePublisherClient(redisUrl?: string): Redis {
  return createRedisClient(redisUrl);
}

export function getSsePublisherClient(): Redis {
  if (!publisherClient) {
    publisherClient = createSsePublisherClient();
  }

  return publisherClient;
}

export function resetSsePublisherClient(): void {
  if (publisherClient) {
    publisherClient.disconnect();
    publisherClient = undefined;
  }
}

export async function publishSseEvent(
  searchJobId: string,
  event: SseEvent,
  client?: Redis,
): Promise<number> {
  const payload = serializeSseEvent(event);
  const redis = client ?? getSsePublisherClient();

  return redis.publish(sseChannelName(searchJobId), payload);
}
