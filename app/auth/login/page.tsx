"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function Page() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.debug('[Login] Starting authentication...')

      // Validate input
      if (!email || !password) {
        throw new Error("Please enter both email and password")
      }

      if (!email.includes('@')) {
        throw new Error("Please enter a valid email address")
      }

      // Verify Supabase client can be initialized
      let supabase
      try {
        console.debug('[Login] Creating Supabase client...')
        supabase = createClient()
        console.debug('[Login] Supabase client initialized successfully')
      } catch (initError) {
        console.error('[Login] Failed to initialize Supabase client:', initError)
        setError(
          initError instanceof Error
            ? `Configuration Error: ${initError.message}`
            : "Failed to initialize authentication service. Please refresh the page."
        )
        return
      }

      console.debug('[Login] Attempting sign in with email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.debug('[Login] Auth response received', { hasError: !!error, hasData: !!data })

      if (error) {
        console.error('[Login] Supabase auth error:', {
          message: error.message,
          status: error.status,
          name: error.name,
        })
        throw error
      }
      
      if (!data.user) {
        const msg = "Login failed - no user data returned"
        console.error('[Login]', msg)
        throw new Error(msg)
      }

      console.debug('[Login] Authentication successful, user:', data.user.id)

      // Check if email is verified if email confirmation is enabled
      if (!data.user.email_confirmed_at) {
        console.warn('[Login] Warning: User email not confirmed yet')
      }

      console.debug('[Login] Redirecting to dashboard')
      // Successfully logged in - redirect to dashboard
      router.push("/dashboard")
      router.refresh() // Force refresh to update session
    } catch (error: unknown) {
      console.error('[Login] Caught exception:', error)
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        // Network/connection errors
        if (
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('network') ||
          errorMsg.includes('econnrefused') ||
          error.name === 'AuthRetryableFetchError' ||
          errorMsg.includes('unauthorized')
        ) {
          setError(
            "Unable to connect to authentication service. Please check: \n" +
            "1. Your internet connection\n" +
            "2. Supabase credentials in .env.local\n" +
            "3. Browser console for detailed errors"
          )
        }
        // Invalid credentials
        else if (
          errorMsg.includes('invalid login') ||
          errorMsg.includes('invalid credentials') ||
          errorMsg.includes('invalid email or password')
        ) {
          setError("Invalid email or password. Please check your credentials and try again.")
        }
        // Email not confirmed
        else if (errorMsg.includes('email') && errorMsg.includes('confirmed')) {
          setError("Please verify your email address before logging in.")
        }
        // User doesn't exist
        else if (errorMsg.includes('user not found')) {
          setError("No account found with this email. Please sign up first.")
        }
        // Generic error message
        else {
          setError(`Authentication Error: ${error.message}`)
        }
      } else {
        setError(
          "An unexpected error occurred during login. Please check the browser console for details."
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-bg">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-text tracking-tight">Welcome Back</h1>
            <p className="text-muted leading-relaxed">Sign in to your Voice AI account</p>
          </div>
          <Card className="shadow-soft-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-6 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="text-accent hover:text-accent-2 underline underline-offset-4 font-medium">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
