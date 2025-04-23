import {
  encryptMessage,
  decryptMessage,
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPrivateKey,
} from "./encryption"

// Key for storing the encryption key in localStorage
const ENCRYPTION_KEY = "dot_ai_encryption_key"

// Initialize encryption
export async function initializeEncryption(): Promise<void> {
  // Check if we already have a key pair
  const storedKey = localStorage.getItem(ENCRYPTION_KEY)

  if (!storedKey) {
    // Generate a new key pair
    const keyPair = await generateKeyPair()

    // Export the keys
    const privateKeyString = await exportPrivateKey(keyPair.privateKey)

    // Store the private key securely
    // In a real app, you might want to encrypt this with a user-provided password
    localStorage.setItem(ENCRYPTION_KEY, privateKeyString)
  }
}

// Store data securely
export async function secureStore(key: string, data: any): Promise<void> {
  try {
    // Get the encryption key
    const privateKeyString = localStorage.getItem(ENCRYPTION_KEY)

    if (!privateKeyString) {
      throw new Error("Encryption not initialized")
    }

    // Import the private key
    const privateKey = await importPrivateKey(privateKeyString)

    // Generate a temporary key pair for this storage operation
    const tempKeyPair = await generateKeyPair()

    // Encrypt the data
    const encryptedData = await encryptMessage(JSON.stringify(data), tempKeyPair.publicKey)

    // Store the encrypted data and the public key
    const publicKeyString = await exportPublicKey(tempKeyPair.publicKey)

    localStorage.setItem(`${key}_data`, encryptedData)
    localStorage.setItem(`${key}_key`, publicKeyString)
  } catch (error) {
    console.error("Error storing data securely:", error)

    // Fallback to regular storage
    localStorage.setItem(key, JSON.stringify(data))
  }
}

// Retrieve data securely
export async function secureRetrieve(key: string): Promise<any> {
  try {
    // Get the encrypted data and public key
    const encryptedData = localStorage.getItem(`${key}_data`)
    const publicKeyString = localStorage.getItem(`${key}_key`)

    if (!encryptedData || !publicKeyString) {
      // Try to get from regular storage as fallback
      const regularData = localStorage.getItem(key)
      return regularData ? JSON.parse(regularData) : null
    }

    // Get the encryption key
    const privateKeyString = localStorage.getItem(ENCRYPTION_KEY)

    if (!privateKeyString) {
      throw new Error("Encryption not initialized")
    }

    // Import the private key
    const privateKey = await importPrivateKey(privateKeyString)

    // Decrypt the data
    const decryptedData = await decryptMessage(encryptedData, privateKey)

    return JSON.parse(decryptedData)
  } catch (error) {
    console.error("Error retrieving data securely:", error)

    // Try to get from regular storage as fallback
    const regularData = localStorage.getItem(key)
    return regularData ? JSON.parse(regularData) : null
  }
}

// Remove data securely
export function secureRemove(key: string): void {
  localStorage.removeItem(`${key}_data`)
  localStorage.removeItem(`${key}_key`)
  localStorage.removeItem(key) // Also remove from regular storage if it exists
}

// Check if secure storage is available
export function isSecureStorageAvailable(): boolean {
  return !!localStorage.getItem(ENCRYPTION_KEY)
}
