import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = global;

if (!globalForRedis.redis) {
  globalForRedis.redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      // Reconnect after
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  globalForRedis.redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
  });

  globalForRedis.redis.on('connect', () => {
    console.log('✅ Connected to Redis successfully');
  });
}

const redis = globalForRedis.redis;

export default redis;
