import type { Message } from './openai'
import { getRedisClient } from '../redis'

const MAX_HISTORY_TURNS = 20
const CONVERSATION_TTL_SECONDS = 24 * 60 * 60 // 24 hours

// In-memory fallback — used when Redis is not configured or unavailable
const memoryStore = new Map<string, Message[]>()

/**
 * Retrieve the conversation history for a given call SID.
 * Uses Redis if available, falls back to in-memory map.
 */
export async function getConversationHistory(callSid: string): Promise<Message[]> {
  const redis = getRedisClient()
  if (redis) {
    try {
      const raw = await redis.get(`conv:${callSid}`)
      if (raw) return JSON.parse(raw) as Message[]
      return []
    } catch (err) {
      console.warn('[Conversation] Redis read failed, using memory fallback:', (err as Error).message)
    }
  }
  return memoryStore.get(callSid) ?? []
}

/**
 * Append a message to the conversation history for a given call SID.
 * Trims to the last MAX_HISTORY_TURNS messages.
 * Persists to Redis with a 24-hour TTL, or falls back to memory.
 */
export async function addToConversation(
  callSid: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  const history = await getConversationHistory(callSid)
  history.push({ role, content })

  // Trim to keep only the last MAX_HISTORY_TURNS messages
  const trimmed = history.length > MAX_HISTORY_TURNS
    ? history.slice(history.length - MAX_HISTORY_TURNS)
    : history

  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.set(`conv:${callSid}`, JSON.stringify(trimmed), 'EX', CONVERSATION_TTL_SECONDS)
      return
    } catch (err) {
      console.warn('[Conversation] Redis write failed, using memory fallback:', (err as Error).message)
    }
  }
  memoryStore.set(callSid, trimmed)
}

/**
 * Delete the conversation history for a given call SID.
 * Removes from Redis if available, and always removes from the memory fallback.
 */
export async function clearConversation(callSid: string): Promise<void> {
  const redis = getRedisClient()
  if (redis) {
    try {
      await redis.del(`conv:${callSid}`)
    } catch (err) {
      console.warn('[Conversation] Redis delete failed:', (err as Error).message)
    }
  }
  // Always clean from memory too (handles Redis write-fallback cases)
  memoryStore.delete(callSid)
}

/**
 * Returns the count of in-memory conversations (useful for debugging when Redis is not configured).
 */
export function getConversationCount(): number {
  return memoryStore.size
}
