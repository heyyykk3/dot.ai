import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type FirestoreError,
} from "firebase/firestore"
import { db, auth } from "./firebase"

/**
 * Enhanced Firestore operations with better error handling and logging
 */

// Error handling wrapper for Firestore operations
export async function firestoreOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  fallbackValue?: T,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const firestoreError = error as FirestoreError
    console.error(`${errorMessage}:`, firestoreError)

    // Log detailed error information
    console.error(`Firestore error code: ${firestoreError.code}`)
    console.error(`Firestore error message: ${firestoreError.message}`)

    // Check for specific error types
    if (firestoreError.code === "permission-denied") {
      console.error("Permission denied. Check Firestore security rules.")
    } else if (firestoreError.code === "unavailable") {
      console.error("Firestore service is currently unavailable. Check your connection.")
    } else if (firestoreError.code === "unauthenticated") {
      console.error("User is not authenticated for this operation.")
    }

    if (fallbackValue !== undefined) {
      return fallbackValue
    }
    throw error
  }
}

// Get a chat document
export async function getChat(chatId: string): Promise<DocumentData | null> {
  return firestoreOperation(
    async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId))
      return chatDoc.exists() ? chatDoc.data() : null
    },
    `Error getting chat ${chatId}`,
    null,
  )
}

// Get messages for a chat
export async function getChatMessages(chatId: string, userId: string): Promise<DocumentData[]> {
  return firestoreOperation(
    async () => {
      const messagesRef = collection(db, "messages")
      const q = query(
        messagesRef,
        where("chatId", "==", chatId),
        where("userId", "==", userId),
        orderBy("timestamp", "asc"),
      )

      const querySnapshot = await getDocs(q)
      const messages: DocumentData[] = []

      querySnapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return messages
    },
    `Error getting messages for chat ${chatId}`,
    [],
  )
}

// Save a message with retry logic
export async function saveMessage(
  chatId: string,
  userId: string,
  role: string,
  content: string,
  maxRetries = 3,
): Promise<string | null> {
  let retries = 0

  while (retries <= maxRetries) {
    try {
      const messageRef = await addDoc(collection(db, "messages"), {
        chatId,
        userId,
        role,
        content,
        timestamp: serverTimestamp(),
      })

      // Update chat timestamp
      await updateDoc(doc(db, "chats", chatId), {
        updatedAt: serverTimestamp(),
      })

      return messageRef.id
    } catch (error) {
      console.error(`Error saving message (attempt ${retries + 1}/${maxRetries + 1}):`, error)
      retries++

      if (retries <= maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, retries), 10000)))
      } else {
        console.error("Failed to save message after multiple attempts")

        // Try to save to localStorage as fallback
        try {
          const fallbackKey = `failed_message_${Date.now()}`
          localStorage.setItem(
            fallbackKey,
            JSON.stringify({
              chatId,
              userId,
              role,
              content,
              timestamp: new Date().toISOString(),
              pendingSync: true,
            }),
          )
          console.log("Message saved to localStorage as fallback")
        } catch (localError) {
          console.error("Failed to save message to localStorage:", localError)
        }

        return null
      }
    }
  }

  return null
}

// Create or update a chat
export async function saveChat(chatId: string, userId: string, topic: string): Promise<boolean> {
  return firestoreOperation(
    async () => {
      await setDoc(
        doc(db, "chats", chatId),
        {
          chatId,
          userId,
          topic,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      return true
    },
    `Error saving chat ${chatId}`,
    false,
  )
}

// Migrate guest chat to Firestore with transaction
export async function migrateGuestChatToFirestore(
  chatId: string,
  messages: any[],
  topic: string,
  userId: string,
): Promise<boolean> {
  return firestoreOperation(
    async () => {
      // First, check if this chat already exists for the user
      const chatDoc = await getDoc(doc(db, "chats", chatId))
      const chatExists = chatDoc.exists() && chatDoc.data().userId === userId

      if (chatExists) {
        console.log(`Chat ${chatId} already exists for user ${userId}, skipping migration`)
        return true
      }

      // Create or update the chat document
      await setDoc(doc(db, "chats", chatId), {
        chatId,
        userId,
        topic: topic || "Migrated Chat",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        migratedFromGuest: true,
      })

      // Add all messages in a batch
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
      return true
    },
    `Error migrating guest chat ${chatId} to Firestore`,
    false,
  )
}

// Sync pending messages from localStorage to Firestore
export async function syncPendingMessages(): Promise<number> {
  if (!auth.currentUser) return 0

  const userId = auth.currentUser.uid
  let syncCount = 0

  // Find all pending messages in localStorage
  const pendingMessages: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith("failed_message_")) {
      pendingMessages.push(key)
    }
  }

  if (pendingMessages.length === 0) return 0

  console.log(`Found ${pendingMessages.length} pending messages to sync`)

  // Try to sync each message
  for (const key of pendingMessages) {
    try {
      const messageJson = localStorage.getItem(key)
      if (!messageJson) continue

      const message = JSON.parse(messageJson)

      // Skip if not for current user
      if (message.userId !== userId) continue

      // Try to save to Firestore
      const messageId = await saveMessage(message.chatId, userId, message.role, message.content)

      if (messageId) {
        // Successfully synced, remove from localStorage
        localStorage.removeItem(key)
        syncCount++
      }
    } catch (error) {
      console.error(`Failed to sync pending message ${key}:`, error)
    }
  }

  console.log(`Successfully synced ${syncCount} pending messages`)
  return syncCount
}
