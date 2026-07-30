import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint for Supabase connectivity
 * Useful for debugging authentication issues
 * GET /api/health
 */
export async function GET() {
  const diagnostics: {
    timestamp: string
    environment: Record<string, unknown>
    supabaseConnection: { status: string; error: string | null }
  } = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) || "MISSING",
    },
    supabaseConnection: {
      status: "unchecked",
      error: null,
    },
  }


  try {
    const supabase = await createClient()
    console.log("[Health Check] Supabase client created successfully")

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      diagnostics.supabaseConnection = {
        status: "error",
        error: `Session check failed: ${sessionError.message}`,
      }
      console.log("[Health Check] Session error:", sessionError)
    } else {
      diagnostics.supabaseConnection = {
        status: session ? "authenticated" : "unauthenticated",
        error: null,
      }
      console.log("[Health Check] Supabase connected successfully")
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    diagnostics.supabaseConnection = {
      status: "error",
      error: errorMessage,
    }
    console.error("[Health Check] Supabase connection failed:", error)
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.supabaseConnection.status === "error" ? 503 : 200,
  })
}
