import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"

export interface UserPreferences {
  customInstructions: string
  preferredTopics: string[]
  avoidTopics: string[]
  writingStyle: string
  responseLength: "concise" | "balanced" | "detailed"
  technicalLevel: "beginner" | "intermediate" | "advanced"
  createdAt: string
  updatedAt: string
}

export const defaultPreferences: UserPreferences = {
  customInstructions: "",
  preferredTopics: [],
  avoidTopics: [],
  writingStyle: "balanced",
  responseLength: "balanced",
  technicalLevel: "intermediate",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

// Get user preferences
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    if (auth.currentUser) {
      // For signed-in users, get from Firestore
      const prefsDoc = await getDoc(doc(db, "userPreferences", auth.currentUser.uid))

      if (prefsDoc.exists()) {
        return prefsDoc.data() as UserPreferences
      } else {
        // Create default preferences if none exist
        await setDoc(doc(db, "userPreferences", auth.currentUser.uid), defaultPreferences)
        return defaultPreferences
      }
    } else {
      // For guest users, get from localStorage
      const storedPrefs = localStorage.getItem("userPreferences")

      if (storedPrefs) {
        return JSON.parse(storedPrefs) as UserPreferences
      } else {
        // Create default preferences if none exist
        localStorage.setItem("userPreferences", JSON.stringify(defaultPreferences))
        return defaultPreferences
      }
    }
  } catch (error) {
    console.error("Error getting user preferences:", error)
    return defaultPreferences
  }
}

// Update user preferences
export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const updatedPrefs = {
      ...preferences,
      updatedAt: new Date().toISOString(),
    }

    if (auth.currentUser) {
      // For signed-in users, update in Firestore
      await updateDoc(doc(db, "userPreferences", auth.currentUser.uid), updatedPrefs)

      // Get the updated preferences
      const prefsDoc = await getDoc(doc(db, "userPreferences", auth.currentUser.uid))
      return prefsDoc.data() as UserPreferences
    } else {
      // For guest users, update in localStorage
      const storedPrefs = localStorage.getItem("userPreferences")
      const currentPrefs = storedPrefs ? JSON.parse(storedPrefs) : defaultPreferences

      const newPrefs = {
        ...currentPrefs,
        ...updatedPrefs,
      }

      localStorage.setItem("userPreferences", JSON.stringify(newPrefs))
      return newPrefs as UserPreferences
    }
  } catch (error) {
    console.error("Error updating user preferences:", error)
    throw error
  }
}

// Get personalized system prompt based on user preferences
export function getPersonalizedSystemPrompt(basePrompt: string, preferences: UserPreferences): string {
  let personalizedPrompt = basePrompt

  // Add custom instructions if available
  if (preferences.customInstructions) {
    personalizedPrompt += `\n\nUser's custom instructions: ${preferences.customInstructions}`
  }

  // Add preferred topics
  if (preferences.preferredTopics.length > 0) {
    personalizedPrompt += `\n\nUser is interested in: ${preferences.preferredTopics.join(", ")}`
  }

  // Add topics to avoid
  if (preferences.avoidTopics.length > 0) {
    personalizedPrompt += `\n\nAvoid discussing: ${preferences.avoidTopics.join(", ")}`
  }

  // Add writing style preference
  personalizedPrompt += `\n\nPreferred writing style: ${preferences.writingStyle}`

  // Add response length preference
  personalizedPrompt += `\n\nPreferred response length: ${preferences.responseLength}`

  // Add technical level preference
  personalizedPrompt += `\n\nTechnical explanation level: ${preferences.technicalLevel}`

  return personalizedPrompt
}
