import {
  createRedisClient,
  formatSseMessage,
  isTerminalSseEvent,
  sseChannelName,
  sseEventSchema,
} from "@leadforge/shared";

export function createJobEventsStream(
  searchJobId: string,
  signal: AbortSignal,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const subscriber = createRedisClient();
  let closed = false;

  const cleanup = () => {
    if (closed) {
      return;
    }

    closed = true;
    subscriber.removeAllListeners();
    void subscriber.unsubscribe().finally(() => {
      subscriber.disconnect();
    });
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const channel = sseChannelName(searchJobId);

      const onAbort = () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // Stream may already be closed.
        }
      };

      signal.addEventListener("abort", onAbort);

      subscriber.on("message", (receivedChannel, message) => {
        if (closed || receivedChannel !== channel) {
          return;
        }

        try {
          const event = sseEventSchema.parse(JSON.parse(message));
          controller.enqueue(encoder.encode(formatSseMessage(event)));

          if (isTerminalSseEvent(event.type)) {
            cleanup();
            controller.close();
          }
        } catch {
          // Ignore malformed messages from the pub/sub channel.
        }
      });

      try {
        await subscriber.subscribe(channel);
      } catch (error) {
        cleanup();
        controller.error(error);
      }
    },
    cancel() {
      cleanup();
    },
  });
}
