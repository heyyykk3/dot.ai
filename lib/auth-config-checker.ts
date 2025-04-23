import { auth } from "@/lib/firebase"
import { fetchSignInMethodsForEmail } from "firebase/auth"

export async function checkAuthProviders() {
  try {
    // Use a test email to check available sign-in methods
    const testEmail = "test@example.com"
    const methods = await fetchSignInMethodsForEmail(auth, testEmail)

    console.log("Available sign-in methods:", methods)

    // Check if Google provider is configured
    const hasGoogleProvider = methods.includes("google.com")

    // Check if Apple provider is configured
    const hasAppleProvider = methods.includes("apple.com")

    // Check if Email/Password provider is configured
    const hasEmailProvider = methods.includes("password")

    return {
      hasGoogleProvider,
      hasAppleProvider,
      hasEmailProvider,
      allMethods: methods,
    }
  } catch (error) {
    console.error("Error checking auth providers:", error)
    return {
      hasGoogleProvider: false,
      hasAppleProvider: false,
      hasEmailProvider: false,
      allMethods: [],
      error,
    }
  }
}
