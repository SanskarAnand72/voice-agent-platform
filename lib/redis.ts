import Redis from 'ioredis'

let redisClient: Redis | null = null
let isRedisConnected = false
let isInitialized = false

function initRedisLazy(): Redis | null {
  if (isInitialized) {
    return isRedisConnected ? redisClient : null
  }

  isInitialized = true
  const redisUrl = process.env.REDIS_URL

  if (!redisUrl) {
    console.log('REDIS_URL not set. Voice AI platform is running in local in-memory fallback mode.')
    return null
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
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

    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    redisClient = null
    return null
  }
}

export function getRedisClient(): Redis | null {
  initRedisLazy()
  return isRedisConnected ? redisClient : null
}

export function isRedisActive(): boolean {
  initRedisLazy()
  return isRedisConnected
}
