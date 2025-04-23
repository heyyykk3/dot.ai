import { auth } from "./firebase"
import { collection, serverTimestamp, writeBatch, doc } from "firebase/firestore"
import { openDB, type IDBPDatabase } from "idb"

// Database name and version
const DB_NAME = "dotAiOfflineDB"
const DB_VERSION = 1

// Store names
const STORES = {
  PENDING_MESSAGES: "pendingMessages",
  PENDING_CHATS: "pendingChats",
}

// Open the IndexedDB database
async function openDatabase(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.PENDING_MESSAGES)) {
        db.createObjectStore(STORES.PENDING_MESSAGES, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(STORES.PENDING_CHATS)) {
        db.createObjectStore(STORES.PENDING_CHATS, { keyPath: "chatId" })
      }
    },
  })
}

// Store a message for offline use
export async function storeMessageOffline(message: any): Promise<string> {
  try {
    const db = await openDatabase()
    const id = message.id || crypto.randomUUID()

    // Add timestamp if not present
    const messageWithMeta = {
      ...message,
      id,
      offlineTimestamp: new Date().toISOString(),
      syncStatus: "pending",
    }

    // Store in IndexedDB
    await db.put(STORES.PENDING_MESSAGES, messageWithMeta)
    console.log(`Message stored offline with ID: ${id}`)
    return id
  } catch (error) {
    console.error("Error storing message offline:", error)
    throw error
  }
}

// Store a chat for offline use
export async function storeChatOffline(chat: any): Promise<void> {
  try {
    const db = await openDatabase()

    // Add metadata
    const chatWithMeta = {
      ...chat,
      offlineTimestamp: new Date().toISOString(),
      syncStatus: "pending",
    }

    // Store in IndexedDB
    await db.put(STORES.PENDING_CHATS, chatWithMeta)
    console.log(`Chat stored offline with ID: ${chat.chatId}`)
  } catch (error) {
    console.error("Error storing chat offline:", error)
    throw error
  }
}

// Get all pending messages
export async function getPendingMessages(): Promise<any[]> {
  try {
    const db = await openDatabase()
    return db.getAll(STORES.PENDING_MESSAGES)
  } catch (error) {
    console.error("Error getting pending messages:", error)
    return []
  }
}

// Get all pending chats
export async function getPendingChats(): Promise<any[]> {
  try {
    const db = await openDatabase()
    return db.getAll(STORES.PENDING_CHATS)
  } catch (error) {
    console.error("Error getting pending chats:", error)
    return []
  }
}

// Delete a pending message
export async function deletePendingMessage(id: string): Promise<void> {
  try {
    const db = await openDatabase()
    await db.delete(STORES.PENDING_MESSAGES, id)
  } catch (error) {
    console.error(`Error deleting pending message ${id}:`, error)
    throw error
  }
}

// Delete a pending chat
export async function deletePendingChat(chatId: string): Promise<void> {
  try {
    const db = await openDatabase()
    await db.delete(STORES.PENDING_CHATS, chatId)
  } catch (error) {
    console.error(`Error deleting pending chat ${chatId}:`, error)
    throw error
  }
}

// Sync all pending data to Firestore
export async function syncPendingData(): Promise<{
  messages: number
  chats: number
  errors: number
}> {
  if (!auth.currentUser) {
    console.log("No authenticated user, skipping sync")
    return { messages: 0, chats: 0, errors: 0 }
  }

  const userId = auth.currentUser.uid
  let syncedMessages = 0
  let syncedChats = 0
  let errors = 0

  try {
    // Get all pending data
    const pendingMessages = await getPendingMessages()
    const pendingChats = await getPendingChats()

    console.log(`Found ${pendingMessages.length} pending messages and ${pendingChats.length} pending chats`)

    // Sync chats first
    for (const chat of pendingChats) {
      try {
        // Skip if not for current user
        if (chat.userId !== userId) continue

        // Save to Firestore
        await setDoc(doc(db, "chats", chat.chatId), {
          ...chat,
          updatedAt: serverTimestamp(),
          syncedFromOffline: true,
        })

        // Delete from IndexedDB
        await deletePendingChat(chat.chatId)
        syncedChats++
      } catch (error) {
        console.error(`Error syncing chat ${chat.chatId}:`, error)
        errors++
      }
    }

    // Use batch for messages
    if (pendingMessages.length > 0) {
      // Process in batches of 20
      const batchSize = 20
      for (let i = 0; i < pendingMessages.length; i += batchSize) {
        const batch = writeBatch(db)
        const messageBatch = pendingMessages.slice(i, i + batchSize)

        for (const message of messageBatch) {
          // Skip if not for current user
          if (message.userId !== userId) continue

          // Add to batch
          const messageRef = doc(collection(db, "messages"))
          batch.set(messageRef, {
            ...message,
            timestamp: serverTimestamp(),
            syncedFromOffline: true,
          })
        }

        // Commit batch
        try {
          await batch.commit()

          // Delete synced messages from IndexedDB
          for (const message of messageBatch) {
            if (message.userId === userId) {
              await deletePendingMessage(message.id)
              syncedMessages++
            }
          }
        } catch (error) {
          console.error("Error committing message batch:", error)
          errors += messageBatch.filter((m) => m.userId === userId).length
        }
      }
    }

    console.log(`Synced ${syncedMessages} messages and ${syncedChats} chats. Errors: ${errors}`)
    return { messages: syncedMessages, chats: syncedChats, errors }
  } catch (error) {
    console.error("Error syncing pending data:", error)
    return { messages: syncedMessages, chats: syncedChats, errors: errors + 1 }
  }
}

// Register sync event with service worker
export async function registerSync(): Promise<boolean> {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register("sync-messages")
      return true
    } catch (error) {
      console.error("Error registering sync:", error)
      return false
    }
  }
  return false
}

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine
}

// Listen for online status changes
export function addOnlineStatusListener(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener("online", handleOnline)
  window.addEventListener("offline", handleOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
  }
}
