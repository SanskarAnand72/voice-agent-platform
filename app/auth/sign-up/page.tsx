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
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.debug('[Sign Up] Validating form...')

      // Validate form inputs
      if (!email || !password || !repeatPassword) {
        throw new Error("All fields are required")
      }

      if (!email.includes('@')) {
        throw new Error("Please enter a valid email address")
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      if (password !== repeatPassword) {
        throw new Error("Passwords do not match")
      }

      console.debug('[Sign Up] Form validation passed')

      // Initialize Supabase client
      console.debug('[Sign Up] Creating Supabase client...')
      let supabase
      try {
        supabase = createClient()
      } catch (initError) {
        console.error('[Sign Up] Failed to create Supabase client:', initError)
        throw new Error(
          initError instanceof Error ? initError.message : "Failed to initialize authentication service"
        )
      }

      console.debug('[Sign Up] Attempting to sign up with email:', email)

      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/sign-up-success`,
        },
      })

      console.debug('[Sign Up] Sign up response received', {
        hasError: !!authError,
        hasUser: !!authData.user,
        userId: authData.user?.id,
      })

      if (authError) {
        console.error('[Sign Up] Auth error from Supabase:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
        })
        throw authError
      }

      if (!authData.user) {
        throw new Error("No user data returned from sign up")
      }

      console.debug('[Sign Up] User created successfully:', authData.user.id)

      // Try to insert into users table (optional - won't fail if table doesn't exist)
      try {
        console.debug('[Sign Up] Attempting to insert into users table...')
        const { error: insertError } = await supabase.from('users').insert({
          id: authData.user.id,
          email: authData.user.email,
        })
        if (insertError) {
          console.warn('[Sign Up] Could not insert into users table:', insertError)
        } else {
          console.debug('[Sign Up] User record created in database')
        }
      } catch (dbError) {
        console.warn('[Sign Up] Exception inserting into users table:', dbError)
      }

      // Try to create workspace (optional)
      try {
        console.debug('[Sign Up] Attempting to create default workspace...')
        const workspaceName = `${email.split('@')[0]}'s Workspace`
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: workspaceName,
            owner_id: authData.user.id,
          })
          .select()
          .single()

        if (workspaceError) {
          console.warn('[Sign Up] Could not create workspace:', workspaceError)
        } else if (workspaceData) {
          console.debug('[Sign Up] Workspace created:', workspaceData.id)

          // Add user as owner to workspace_members
          try {
            const { error: memberError } = await supabase.from('workspace_members').insert({
              user_id: authData.user.id,
              workspace_id: workspaceData.id,
              role: 'owner',
            })
            if (memberError) {
              console.warn('[Sign Up] Could not add user to workspace_members:', memberError)
            } else {
              console.debug('[Sign Up] User added to workspace as owner')
            }
          } catch (memberError) {
            console.warn('[Sign Up] Exception adding user to workspace:', memberError)
          }
        }
      } catch (dbError) {
        console.warn('[Sign Up] Exception creating workspace:', dbError)
      }

      // Check if email verification is enabled
      const needsEmailConfirmation = !authData.session
      if (needsEmailConfirmation) {
        console.debug('[Sign Up] Email verification required, redirecting to success page')
        router.push("/auth/sign-up-success")
      } else {
        console.debug('[Sign Up] No email verification required, redirecting to dashboard')
        router.push("/dashboard")
      }

      router.refresh()
    } catch (error: unknown) {
      console.error('[Sign Up] Error during sign up:', error)

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()

        // Network/connection errors
        if (
          errorMsg.includes('fetch failed') ||
          errorMsg.includes('network') ||
          error.name === 'AuthRetryableFetchError'
        ) {
          setError("Unable to connect to authentication service. Please check your internet connection and try again.")
        }
        // User already registered
        else if (
          errorMsg.includes('user already registered') ||
          errorMsg.includes('already exists')
        ) {
          setError("This email is already registered. Please login instead or use a different email.")
        }
        // Password too weak
        else if (errorMsg.includes('password')) {
          setError(error.message)
        }
        // Invalid email
        else if (errorMsg.includes('email')) {
          setError("Please enter a valid email address")
        }
        // Generic error
        else {
          setError(error.message || "An error occurred during sign up")
        }
      } else {
        setError("An unexpected error occurred during sign up")
      }

      console.error('[Sign Up] Attempting to handle signup response...')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sign up</CardTitle>
              <CardDescription>Create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
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
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="repeat-password">Repeat Password</Label>
                    </div>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating an account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4">
                    Login
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
