import { initializeApp, getApps } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { collection, serverTimestamp, writeBatch, doc, setDoc } from "firebase/firestore"

// Firebase configuration with environment variables and fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDvAfY7a7jRUsHaisL4o22qCcezarF9aTo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dotai-heykk.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dotai-heykk",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dotai-heykk.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "200117268050",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:200117268050:web:c03f3d65961df007a0b98b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-619ZE7HT32",
}

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Set persistence to LOCAL (this will help with the redirect flow)
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Error setting auth persistence:", error)
  })
}

// Function to check if Firebase is properly initialized
export function isFirebaseInitialized() {
  try {
    return !!auth && !!db && !!storage
  } catch (error) {
    console.error("Error checking Firebase initialization:", error)
    return false
  }
}

// Enhanced error handling for Firebase auth errors
export function handleAuthError(error: any): string {
  console.error("Firebase auth error:", error)

  // Extract error code and message for better debugging
  const errorCode = error?.code || ""
  const errorMessage = error?.message || ""

  // Log additional details that might help with debugging
  console.log("Full error object:", JSON.stringify(error, null, 2))
  console.log("Error code:", errorCode)
  console.log("Error message:", errorMessage)

  // Map error codes to user-friendly messages
  switch (errorCode) {
    case "auth/invalid-email":
      return "The email address is not valid."
    case "auth/user-disabled":
      return "This user account has been disabled."
    case "auth/user-not-found":
      return "No user found with this email address."
    case "auth/wrong-password":
      return "Incorrect password."
    case "auth/email-already-in-use":
      return "This email is already in use by another account."
    case "auth/weak-password":
      return "The password is too weak."
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing the sign in."
    case "auth/cancelled-popup-request":
      return "The sign-in popup was cancelled."
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by the browser."
    case "auth/network-request-failed":
      return "A network error occurred. Please check your connection."
    case "auth/internal-error":
      return "An internal authentication error occurred. Please try again later or use a different sign-in method."
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled for this project. Please contact support."
    case "auth/unauthorized-domain":
      return "This domain is not authorized for OAuth operations. Please add it in the Firebase Console."
    case "auth/timeout":
      return "The operation has timed out. Please try again."
    case "auth/web-storage-unsupported":
      return "Web storage is not supported or is disabled. Please enable cookies."
    case "auth/redirect-cancelled-by-user":
      return "The redirect operation was cancelled by the user."
    case "auth/redirect-operation-pending":
      return "A redirect sign-in operation is already pending. Please wait."
    default:
      return errorMessage || "An unknown authentication error occurred."
  }
}

// Enable local emulator if needed (for development)
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  // Uncomment these lines to use Firebase emulators during development
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
}

/**
 * Migrates a guest chat to Firestore when a user signs in
 * @param chatId The chat ID to migrate
 * @param messages The messages to migrate
 * @param topic The chat topic
 * @param userId The authenticated user ID
 */
export async function migrateGuestChatToFirestore(
  chatId: string,
  messages: any[],
  topic: string,
  userId: string,
): Promise<void> {
  try {
    // First, create or update the chat document
    await setDoc(doc(db, "chats", chatId), {
      chatId,
      userId,
      topic: topic || "Migrated Chat",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      migratedFromGuest: true,
    })

    // Then add all messages in a batch
    const batch = writeBatch(db)
    const messagesRef = collection(db, "messages")

    messages.forEach((message) => {
      const messageDoc = doc(messagesRef)
      batch.set(messageDoc, {
        chatId,
        userId,
        role: message.role,
        content: message.content,
        timestamp: serverTimestamp(),
        originalTimestamp: message.timestamp || new Date().toISOString(),
      })
    })

    // Commit the batch
    await batch.commit()

    console.log(`Successfully migrated ${messages.length} messages for chat ${chatId}`)

    // Optionally, clear the localStorage data for this chat
    // localStorage.removeItem(`chat_${chatId}`);
    // localStorage.removeItem(`topic_${chatId}`);

    return
  } catch (error) {
    console.error("Error migrating guest chat to Firestore:", error)
    throw error
  }
}
