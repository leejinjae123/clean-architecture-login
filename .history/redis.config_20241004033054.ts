import { Redis } from 'ioredis';
import Redlock from 'redlock';

export const redisClient = new Redis({
  host: 'localhost', // Redis 서버 호스트
  port: 6379, // Redis 서버 포트
});

export const redLock = new Redlock([redisClient], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
});