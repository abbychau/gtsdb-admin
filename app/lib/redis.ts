import { createClient } from 'redis';

// Lazy Redis client: only connects when REDIS_URL is set, and only on first
// use. Connecting at module load (as before) crashed the server — and CI
// builds — whenever REDIS_URL was unset, because next build imports the
// route modules to collect page data.
let redisPromise: Promise<ReturnType<typeof createClient>> | null = null;

export function getRedis() {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!redisPromise) {
    redisPromise = createClient({ url: process.env.REDIS_URL }).connect();
  }
  return redisPromise;
}
