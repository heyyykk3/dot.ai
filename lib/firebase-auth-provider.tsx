"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInAnonymously,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signInWithRedirect, // Added import
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signInAnonymously: () => Promise<User>
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set persistence to LOCAL
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch((error) => {
      console.error("Error setting auth persistence:", error)
    })
  }, [])

  // Check for redirect result on initial load
  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          console.log("Redirect sign-in successful:", result.user.uid)
        }
      } catch (error) {
        console.error("Error checking redirect result:", error)
      }
    }

    checkRedirectResult()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        // Add this check to prevent the profile error
        if (user) {
          // Ensure user object is complete before setting
          if (!user.metadata) {
            console.warn("User object is incomplete, waiting for full profile data")
            return
          }
        }

        setUser(user)
        setLoading(false)
        if (user) {
          console.log("Auth state changed: User is signed in", user.uid)
        } else {
          console.log("Auth state changed: User is signed out")
        }
      },
      (error) => {
        console.error("Auth state change error:", error)
        setError(error.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      return result.user
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message)
      throw error
    }
  }

  // Add this debug logging to the signInWithGoogle function
  const signInWithGoogle = async () => {
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      // Add scopes for better user info
      provider.addScope("email")
      provider.addScope("profile")

      // Set custom parameters
      provider.setCustomParameters({
        prompt: "select_account",
      })

      // Add detailed logging
      console.log("Starting Google sign-in process with environment:", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 5) + "...",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.substring(0, 10) + "...",
        deployedUrl: typeof window !== "undefined" ? window.location.origin : "unknown",
      })

      // Try popup first with better error handling
      try {
        console.log("Attempting popup sign-in method")
        const result = await signInWithPopup(auth, provider)
        console.log("Google sign-in successful via popup:", result.user.uid)
        return result.user
      } catch (popupError: any) {
        console.log(`Popup sign-in failed with code: ${popupError.code}`, popupError)
        console.log("Full error details:", JSON.stringify(popupError, null, 2))

        // If popup fails, fall back to redirect with specific error codes
        if (
          popupError.code === "auth/popup-blocked" ||
          popupError.code === "auth/popup-closed-by-user" ||
          popupError.code === "auth/cancelled-popup-request" ||
          popupError.code === "auth/network-request-failed"
        ) {
          console.log("Falling back to redirect sign-in method")
          // Store a flag in localStorage to indicate we're in the middle of a redirect flow
          localStorage.setItem("authRedirectInProgress", "true")
          await signInWithRedirect(auth, provider)
          // This will redirect, so we won't reach the next line
          throw new Error("Redirecting to Google sign-in...")
        } else {
          throw popupError
        }
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      setError(error.message)
      throw error
    }
  }

  const signInAnon = async () => {
    setError(null)
    try {
      const result = await signInAnonymously(auth)
      return result.user
    } catch (error: any) {
      console.error("Anonymous sign in error:", error)
      setError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    setError(null)
    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      console.error("Sign out error:", error)
      setError(error.message)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInAnonymously: signInAnon,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within a FirebaseAuthProvider")
  }
  return context
}
