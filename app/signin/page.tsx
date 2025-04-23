"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  getRedirectResult,
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { User, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Add the BackgroundPath component import
import { BackgroundPath } from "@/components/background-path"

// Import the GoogleSignInButton component
import { GoogleSignInButton } from "@/components/google-signin-button"

// Import the AppleSignInButton component
import { AppleSignInButton } from "@/components/apple-sign-in-button"

// Import the handleAuthError function
import { handleAuthError } from "@/lib/firebase"

// Import the migrateGuestChatToFirestore function
import { migrateGuestChatToFirestore } from "@/lib/firebase"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isRedirectChecked, setIsRedirectChecked] = useState(false)

  // Check if user is already signed in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to chat
        console.log("User is already signed in:", user.uid)
        router.push("/chat")
      }
      setIsInitializing(false)
    })

    return () => unsubscribe()
  }, [router])

  // Add this effect to handle the redirect result more effectively
  useEffect(() => {
    async function checkRedirectResult() {
      try {
        setIsLoading(true)
        console.log("Checking redirect result...")

        // Check if we were in the middle of a redirect flow
        const redirectInProgress = localStorage.getItem("authRedirectInProgress")

        const result = await getRedirectResult(auth)

        // Clear the redirect flag regardless of result
        localStorage.removeItem("authRedirectInProgress")

        if (result) {
          // User successfully signed in
          console.log("Redirect result successful:", result.user.uid)

          // Migrate any guest data if needed
          await migrateGuestData(result.user.uid)

          router.push("/chat")
        } else if (redirectInProgress) {
          // We were expecting a redirect result but didn't get one
          console.log("Redirect was in progress but no result returned")
          setError("Sign-in was interrupted. Please try again.")
        }
      } catch (error: any) {
        console.error("Redirect result error:", error)
        setError(handleAuthError(error))
        localStorage.removeItem("authRedirectInProgress")
      } finally {
        setIsLoading(false)
        setIsRedirectChecked(true)
      }
    }

    if (!isRedirectChecked) {
      checkRedirectResult()
    }
  }, [router, isRedirectChecked])

  // Add this helper function to migrate guest data
  async function migrateGuestData(userId: string) {
    try {
      // Get the current guest chat ID
      const guestSession = localStorage.getItem("guestSession")
      if (!guestSession) return

      const { chatId } = JSON.parse(guestSession)
      if (!chatId) return

      // Get messages for this chat
      const messagesJson = localStorage.getItem(`chat_${chatId}`)
      if (!messagesJson) return

      const messages = JSON.parse(messagesJson)
      if (!messages || messages.length === 0) return

      // Get topic
      const topic = localStorage.getItem(`topic_${chatId}`) || "Migrated Chat"

      console.log(`Migrating guest chat ${chatId} with ${messages.length} messages to user ${userId}`)

      // Use the migration function
      await migrateGuestChatToFirestore(chatId, messages, topic, userId)

      console.log("Guest chat migration successful")
    } catch (error) {
      console.error("Error migrating guest data:", error)
      // Don't throw - we don't want to interrupt the sign-in flow
    }
  }

  // Update the handleSignIn function to use better error handling
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Log the attempt for debugging
      console.log("Attempting to sign in with email:", email)

      await signInWithEmailAndPassword(auth, email, password)
      router.push("/chat")
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleSignUp function to use better error handling
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // Log the attempt for debugging
      console.log("Attempting to create account with email:", email)

      await createUserWithEmailAndPassword(auth, email, password)
      router.push("/chat")
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestMode = () => {
    router.push("/chat")
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!email) {
      setError("Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setSuccess("Password reset email sent. Please check your inbox.")
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(handleAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  // New function for handling guest sign in
  const handleGuestSignIn = () => {
    router.push("/chat")
  }

  // Show loading state while checking auth
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Update the return statement to include the BackgroundPath and use our new button styles
  return (
    <div className="min-h-screen flex flex-col relative">
      <BackgroundPath />
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-2xl font-bold">dot.ai</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Sign in to dot.ai</CardTitle>
            <CardDescription>Choose your preferred sign in method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <GoogleSignInButton className="w-full rounded-full" />
              <AppleSignInButton className="w-full rounded-full" />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue as guest</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full rounded-full border-sky-400 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20"
              onClick={handleGuestSignIn}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <User className="mr-2 h-4 w-4" />}
              Continue as Guest
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                By signing in, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
