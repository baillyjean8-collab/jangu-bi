'use strict';

const Redis = require('ioredis');

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn('REDIS_URL non defini - rate limiter utilisera la memoire locale');
    return null;
  }

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });

  redisClient.on('error', (err) => {
    console.error('Erreur connexion Redis:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Connecte a Redis avec succes');
  });

  return redisClient;
}

module.exports = { getRedisClient };
