import twilio from 'twilio'
import { type NextRequest } from 'next/server'

/**
 * Verifies an incoming Twilio webhook request using HMAC-SHA1 signature.
 *
 * Twilio signs every request it sends with an X-Twilio-Signature header.
 * This function validates that the signature matches, preventing spoofed requests.
 *
 * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
 *
 * @param request - The incoming Next.js request
 * @param body    - The raw URL-encoded body as a key/value map
 * @returns true if the signature is valid (or if verification is disabled in dev)
 */
export async function verifyTwilioSignature(
  request: NextRequest,
  body: Record<string, string>
): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!authToken) {
    console.error('[security] TWILIO_AUTH_TOKEN is not set — cannot verify webhook signature')
    return false
  }

  // In bypass/dev mode, skip signature verification to allow ngrok/localhost testing
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return true
  }

  const twilioSignature = request.headers.get('x-twilio-signature') ?? ''
  if (!twilioSignature) {
    console.warn('[security] Missing X-Twilio-Signature header')
    return false
  }

  // Build the full URL that Twilio would have used to sign the request
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${request.headers.get('host')}`
  const url = `${baseUrl}${request.nextUrl.pathname}${request.nextUrl.search}`

  try {
    const isValid = twilio.validateRequest(authToken, twilioSignature, url, body)
    if (!isValid) {
      console.warn('[security] Invalid Twilio signature for URL:', url)
    }
    return isValid
  } catch (err) {
    console.error('[security] Twilio signature validation threw an error:', err)
    return false
  }
}

/**
 * Sanitize a string to prevent prompt injection or XSS in stored content.
 * Strips HTML tags and limits length.
 */
export function sanitizeInput(input: string, maxLength = 2000): string {
  return input
    .replace(/<[^>]*>/g, '')       // strip HTML tags
    .replace(/[^\x20-\x7E\n\r]/g, '') // keep only printable ASCII + newlines
    .trim()
    .slice(0, maxLength)
}

/**
 * Simple in-memory rate limiter for API routes.
 * Limits requests per IP to `maxRequests` within `windowMs` milliseconds.
 * For production, replace with Redis-backed rate limiting (e.g. Upstash ratelimit).
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 30,
  windowMs = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    rateLimitStore.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}
