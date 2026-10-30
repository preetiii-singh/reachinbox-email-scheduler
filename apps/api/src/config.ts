import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// npm workspaces may launch this process from the monorepo root; make the API
// configuration location explicit rather than relying on process.cwd().
dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
export const config = {
  port: Number(process.env.PORT ?? 4000), webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://reachinbox:reachinbox@localhost:5432/reachinbox', redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  elasticUrl: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200', elasticApiKey: process.env.ELASTICSEARCH_API_KEY, elasticUsername: process.env.ELASTICSEARCH_USERNAME, elasticPassword: process.env.ELASTICSEARCH_PASSWORD, sessionSecret: process.env.SESSION_SECRET ?? 'development-only-secret',
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? 10), maxHourly: Number(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER ?? 200), minDelay: Number(process.env.MIN_SEND_DELAY_MS ?? 500)
};
