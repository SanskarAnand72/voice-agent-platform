import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log environment variable status for debugging
  if (typeof window !== 'undefined') {
    console.debug('[Supabase Client] Initialization check:', {
      urlPrefix: supabaseUrl?.substring(0, 30) + '...' || 'MISSING',
      keyPrefix: supabaseAnonKey?.substring(0, 20) + '...' || 'MISSING',
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseAnonKey,
    })
  }

  if (!supabaseUrl) {
    const error = new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file."
    )
    console.error('[Supabase Client] Configuration error:', error)
    throw error
  }

  if (!supabaseAnonKey) {
    const error = new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file."
    )
    console.error('[Supabase Client] Configuration error:', error)
    throw error
  }

  try {
    console.debug('[Supabase Client] Creating browser client for:', supabaseUrl)
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('[Supabase Client] Failed to create client:', error)
    throw new Error(
      `Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}
