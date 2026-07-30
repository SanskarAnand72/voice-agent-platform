import Redis from 'ioredis'

let redisClient: Redis | null = null
let isRedisConnected = false

const redisUrl = process.env.REDIS_URL

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        // Only retry up to 3 times before failing
        if (times > 3) {
          console.warn('Redis connection failed. Falling back to memory.')
          return null
        }
        return Math.min(times * 100, 2000)
      },
    })

    redisClient.on('connect', () => {
      isRedisConnected = true
      console.log('Redis connected successfully.')
    })

    redisClient.on('error', (err) => {
      isRedisConnected = false
      console.warn('Redis error occurred:', err.message)
    })
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    redisClient = null
  }
} else {
  console.log('REDIS_URL not set. Voice AI platform is running in local in-memory fallback mode.')
}

export function getRedisClient(): Redis | null {
  return isRedisConnected ? redisClient : null
}

export function isRedisActive(): boolean {
  return isRedisConnected
}
