// This is a simplified implementation of end-to-end encryption
// In a production environment, you would use a more robust library like libsodium

// Generate a key pair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  )
}

// Export public key to string
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", publicKey)
  return arrayBufferToBase64(exported)
}

// Export private key to string (should be stored securely)
export async function exportPrivateKey(privateKey: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey)
  return arrayBufferToBase64(exported)
}

// Import public key from string
export async function importPublicKey(publicKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyString)
  return window.crypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"],
  )
}

// Import private key from string
export async function importPrivateKey(privateKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(privateKeyString)
  return window.crypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  )
}

// Encrypt a message
export async function encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
  // Generate a random AES key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"],
  )

  // Encrypt the message with AES
  const encoder = new TextEncoder()
  const messageData = encoder.encode(message)
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    messageData,
  )

  // Export the AES key
  const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey)

  // Encrypt the AES key with RSA
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    exportedAesKey,
  )

  // Combine the encrypted data
  const result = {
    encryptedMessage: arrayBufferToBase64(encryptedMessage),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv),
  }

  return JSON.stringify(result)
}

// Decrypt a message
export async function decryptMessage(encryptedData: string, privateKey: CryptoKey): Promise<string> {
  const { encryptedMessage, encryptedKey, iv } = JSON.parse(encryptedData)

  // Decrypt the AES key with RSA
  const encryptedKeyData = base64ToArrayBuffer(encryptedKey)
  const aesKeyData = await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedKeyData,
  )

  // Import the AES key
  const aesKey = await window.crypto.subtle.importKey(
    "raw",
    aesKeyData,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"],
  )

  // Decrypt the message with AES
  const encryptedMessageData = base64ToArrayBuffer(encryptedMessage)
  const ivData = base64ToArrayBuffer(iv)
  const decryptedMessage = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivData,
    },
    aesKey,
    encryptedMessageData,
  )

  const decoder = new TextDecoder()
  return decoder.decode(decryptedMessage)
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}
