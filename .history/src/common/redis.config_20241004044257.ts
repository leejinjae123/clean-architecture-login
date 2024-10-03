import Redis from 'ioredis';
import Redlock from 'redlock';

   export const redisClient = new Redis({
     host: process.env.REDIS_HOST || 'localhost',
     port: parseInt(process.env.REDIS_PORT || '6379'),
   });

   export const redLock = new Redlock(
     [redisClient],
     {
       driftFactor: 0.01,
       retryCount: 10,
       retryDelay: 200,
       retryJitter: 200,
     }
   );
   process.on('SIGINT', () => {
    redisClient.quit();
  });