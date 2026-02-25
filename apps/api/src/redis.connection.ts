import Redis from 'ioredis';

let sharedConnection: Redis | null = null;

interface RedisConnectionOptions {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: number | null;
  enableReadyCheck: boolean;
  lazyConnect: boolean;
  tls?: { rejectUnauthorized: boolean };
}

function parseRedisUrl(url: string): RedisConnectionOptions {
  const u = new URL(url);
  const opts: RedisConnectionOptions = {
    host: u.hostname,
    port: parseInt(u.port, 10) || 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  };
  if (u.password) opts.password = decodeURIComponent(u.password);
  if (u.protocol === 'rediss:') opts.tls = { rejectUnauthorized: true };
  return opts;
}

export function getRedisConnection(): Redis {
  if (sharedConnection) return sharedConnection;
  const url = process.env.REDIS_URL;
  const opts: RedisConnectionOptions = url
    ? parseRedisUrl(url)
    : {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      };
  sharedConnection = new Redis(opts);
  return sharedConnection;
}
