import Redis from 'ioredis';
import Redlock from 'redlock';

   export const redisClient = new Redis({
     host: process.env.REDIS_HOST || 'localhost',
     port: parseInt(process.env.REDIS_PORT || '6379'),
   });

   export const redLock = new Redlock(
     [redisClient],
     {
       // the expected clock drift; for more details
       // see http://redis.io/topics/distlock
       driftFactor: 0.01, // multiplied by lock ttl to determine drift time

       // the max number of times Redlock will attempt
       // to lock a resource before erroring
       retryCount: 10,

       // the time in ms between attempts
       retryDelay: 200, // time in ms

       // the max time in ms randomly added to retries
       // to improve performance under high contention
       // see https://www.awsarchitectureblog.com/2015/03/backoff.html
       retryJitter: 200 // time in ms
     }
   );
   process.on('SIGINT', () => {
    redisClient.quit();
  });