import { collection, setDoc, doc, serverTimestamp, writeBatch, getDoc } from "firebase/firestore"
import { db } from "./firebase"

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
    // Check if this chat already exists for the user
    const chatDoc = await getDoc(doc(db, "chats", chatId))
    const chatExists = chatDoc.exists() && chatDoc.data().userId === userId

    if (chatExists) {
      console.log(`Chat ${chatId} already exists for user ${userId}, skipping migration`)
      return
    }

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

/**
 * Checks if a chat exists in Firestore
 * @param chatId The chat ID to check
 * @param userId The user ID
 */
export async function doesChatExistInFirestore(chatId: string, userId: string): Promise<boolean> {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId))
    return chatDoc.exists() && chatDoc.data().userId === userId
  } catch (error) {
    console.error("Error checking if chat exists:", error)
    return false
  }
}
