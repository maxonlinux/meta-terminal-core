import { connect, JSONCodec, type NatsConnection } from "nats";
import { logger } from "../logger";

const codec = JSONCodec();

type NatsConfig = {
  url: string;
  token: string;
};

export class NatsClient {
  private static instances = new Map<string, Promise<NatsClient>>();
  private nc: NatsConnection;
  private url: string;

  private constructor(conn: NatsConnection, url: string) {
    this.nc = conn;
    this.url = url;
  }

  static async getInstance(url: string, token: string): Promise<NatsClient> {
    const key = `${url}|${token}`;
    const existing = NatsClient.instances.get(key);
    if (existing) return existing;

    const created = NatsClient.create({ url, token });
    NatsClient.instances.set(key, created);

    try {
      return await created;
    } catch (error) {
      NatsClient.instances.delete(key);
      throw error;
    }
  }

  private static async create(config: NatsConfig): Promise<NatsClient> {
    const conn = await connect({ servers: config.url, token: config.token });
    logger.info("NATS connected", { url: config.url });
    return new NatsClient(conn, config.url);
  }

  publish(subject: string, data: unknown): void {
    this.nc.publish(subject, codec.encode(data));
  }

  subscribe<T>(subject: string, handler: (data: T) => void): () => void {
    const sub = this.nc.subscribe(subject);

    (async () => {
      for await (const msg of sub) {
        handler(codec.decode(msg.data) as T);
      }
    })();

    return () => sub.unsubscribe();
  }

  async disconnect(): Promise<void> {
    await this.nc.drain();
    logger.info("NATS disconnected", { url: this.url });
  }

  get connection(): NatsConnection {
    return this.nc;
  }
}
