import { promisify } from "util";

import { createClient } from "redis";

export type RedisConfig = {
  host: string;
  port: number;
};

/** An async-await compatible wrapper around a `RedisClient`. */
export class AsyncRedisClient {
  /** Pop an item from the right side of the `src` list, push it onto the left side
   * of the `dst` list, and return the item. If the `src` list is empty, and
   * `timeoutSecs` is `0`, the function blocks indefinitely until an item arrives,
   * otherwise, it waits for the specified time, returning `null` if no new item arrives.
   * */
  brpoplpush: (
    src: string,
    dst: string,
    timeoutSecs: number
  ) => Promise<string | null>;

  /** Pop an item from the right side of the `src` list, push it onto the left side of
   * the `dst` list and return the item. Returns `null` if the `src` queue is empty. */
  rpoplpush: (src: string, dst: string) => Promise<string | null>;

  /** Pop an item from the left side of a list, if the list exists. */
  lpop: (key: string) => Promise<string | null>;

  /** Push one or more values onto the left side of a list. Returns the new size of the
   * list. */
  lpush: (key: string, ...values: string[]) => Promise<number>;

  /** Push one or more values onto the right side of a list. Returns the new size of the
   * list. */
  rpush: (key: string, ...values: string[]) => Promise<number>;

  /** Get a value, if it exists. */
  get: (key: string) => Promise<string | null>;

  /** Set a value. */
  set: (key: string, value: string) => Promise<void>;

  /** Get the TTL of a value. Returns a negative value if the key is not set, or if
   * the key does not have a TTL. */
  ttl: (key: string) => Promise<number>;

  /** Set a value if `key` does not exist. Returns 1 if the key was set, 0 otherwise. */
  setnx: (key: string, value: string) => Promise<number>;

  /** Set the expiration of a `key` in seconds. Returns 1 if the expiry was set. */
  expire: (key: string, seconds: number) => Promise<number>;

  private quit: () => Promise<"OK">;

  constructor(cfg: RedisConfig) {
    const client = createClient({
      ...cfg,
      retry_strategy: (options) => {
        if (options.total_retry_time > 30_000) {
          throw new Error(
            "could not connect to Redis server within 30 seconds"
          );
        }
        return 1_000;
      },
    });

    this.quit = promisify(client.quit).bind(client);
    this.brpoplpush = promisify(client.brpoplpush).bind(client);
    this.rpoplpush = promisify(client.rpoplpush).bind(client);
    this.lpop = promisify(client.lpop).bind(client);
    this.get = promisify(client.get).bind(client);
    this.ttl = promisify(client.ttl).bind(client);
    this.setnx = promisify(client.setnx).bind(client);
    this.expire = promisify(client.expire).bind(client);
    this.lpush = promisify(client.lpush).bind(client);
    this.rpush = promisify(client.rpush).bind(client);

    const set = promisify(client.set).bind(client);
    this.set = async (key: string, value: string) => {
      await set(key, value);
    };
  }

  /** Close the connection to the Redis server, waiting for all pending commands to
   * complete. */
  async close(): Promise<void> {
    await this.quit();
  }
}
