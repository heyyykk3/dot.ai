import { collection, getDocs, query, limit, addDoc, deleteDoc } from "firebase/firestore"
import { db, auth } from "./firebase"

/**
 * Tests Firestore permissions by attempting to read and write
 * @returns Object with test results
 */
export async function testFirestorePermissions() {
  const results = {
    canRead: false,
    canWrite: false,
    canDelete: false,
    errors: [] as string[],
  }

  if (!auth.currentUser) {
    results.errors.push("No authenticated user")
    return results
  }

  try {
    // Test reading
    const messagesRef = collection(db, "messages")
    const q = query(messagesRef, limit(1))

    try {
      const querySnapshot = await getDocs(q)
      results.canRead = true
      console.log("Read test successful")
    } catch (readError: any) {
      results.errors.push(`Read error: ${readError.message}`)
      console.error("Read test failed:", readError)
    }

    // Test writing
    try {
      const testDoc = await addDoc(collection(db, "permissionTests"), {
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString(),
        test: true,
      })

      results.canWrite = true
      console.log("Write test successful")

      // Test deleting
      try {
        await deleteDoc(testDoc)
        results.canDelete = true
        console.log("Delete test successful")
      } catch (deleteError: any) {
        results.errors.push(`Delete error: ${deleteError.message}`)
        console.error("Delete test failed:", deleteError)
      }
    } catch (writeError: any) {
      results.errors.push(`Write error: ${writeError.message}`)
      console.error("Write test failed:", writeError)
    }

    return results
  } catch (error: any) {
    results.errors.push(`General error: ${error.message}`)
    console.error("Permission test failed:", error)
    return results
  }
}
