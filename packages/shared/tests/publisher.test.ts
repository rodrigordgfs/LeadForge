import { afterEach, describe, expect, it } from "vitest";

import {
  publishSseEvent,
  resetSsePublisherClient,
} from "../src/events/publisher.js";
import {
  formatSseMessage,
  serializeSseEvent,
  sseChannelName,
} from "../src/events/sse.js";
import { createRedisClient } from "../src/events/redis-client.js";

describe("publishSseEvent", () => {
  afterEach(() => {
    resetSsePublisherClient();
  });

  it("serializes progress event with progressPct field", () => {
    const serialized = serializeSseEvent({
      type: "progress",
      payload: {
        progressPct: 33,
      },
    });

    expect(JSON.parse(serialized)).toMatchObject({
      type: "progress",
      payload: { progressPct: 33 },
    });
  });

  it("formats SSE messages for streaming clients", () => {
    const message = formatSseMessage({
      type: "progress",
      payload: { progressPct: 90 },
    });

    expect(message).toBe(
      'event: progress\ndata: {"type":"progress","payload":{"progressPct":90}}\n\n',
    );
  });

  it("publishes validated events to the job channel", async () => {
    if (!process.env.REDIS_URL) {
      return;
    }

    const searchJobId = `publisher-${Date.now()}`;
    const subscriber = createRedisClient();
    const channel = sseChannelName(searchJobId);
    const received = new Promise<string>((resolve) => {
      subscriber.on("message", (receivedChannel, message) => {
        if (receivedChannel === channel) {
          resolve(message);
        }
      });
    });

    await subscriber.subscribe(channel);
    await publishSseEvent(searchJobId, {
      type: "progress",
      payload: { progressPct: 15 },
    });

    await expect(received).resolves.toContain('"progressPct":15');

    await subscriber.unsubscribe();
    subscriber.disconnect();
  });
});
