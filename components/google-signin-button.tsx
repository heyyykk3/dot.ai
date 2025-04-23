"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChromeIcon as Google, Loader2 } from "lucide-react"
import { signInWithRedirect, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { handleAuthError } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface GoogleSignInButtonProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function GoogleSignInButton({ className, variant = "outline", size = "default" }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    setIsLoading(true)

    try {
      const provider = new GoogleAuthProvider()

      // Add scopes for better user info
      provider.addScope("email")
      provider.addScope("profile")

      // Set custom parameters
      provider.setCustomParameters({
        prompt: "select_account",
      })

      // Log the attempt for debugging
      console.log("Attempting Google sign in with popup")

      try {
        // Try popup first (works better on desktop)
        const result = await signInWithPopup(auth, provider)
        console.log("Google sign in successful:", result.user.uid)
        router.push("/chat")
      } catch (popupError: any) {
        console.log("Popup failed, falling back to redirect:", popupError.code)

        // If popup fails (common on mobile), fall back to redirect
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/cancelled-popup-request"
        ) {
          console.log("Using redirect method instead")
          // Store a flag in localStorage to indicate we're in the middle of a redirect flow
          localStorage.setItem("authRedirectInProgress", "true")
          await signInWithRedirect(auth, provider)
          // Don't set isLoading to false here as we're redirecting
          return
        } else {
          // For other errors, propagate them
          throw popupError
        }
      }
    } catch (error: any) {
      console.error("Google sign in error:", error)
      const errorMessage = handleAuthError(error)
      alert(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={handleGoogleSignIn} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Google className="mr-2 h-4 w-4" />}
      Sign in with Google
    </Button>
  )
}
