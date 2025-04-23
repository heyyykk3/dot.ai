// IndexedDB wrapper for better data persistence

const DB_NAME = "dotAiDB"
const DB_VERSION = 1

// Database schema
const STORES = {
  messages: { keyPath: "id", indexes: ["chatId", "timestamp"] },
  chats: { keyPath: "id", indexes: ["userId", "updatedAt"] },
  settings: { keyPath: "id" },
  preferences: { keyPath: "id" },
  files: { keyPath: "id", indexes: ["chatId", "timestamp"] },
}

// Open database connection
export async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Create object stores and indexes
      Object.entries(STORES).forEach(([storeName, { keyPath, indexes = [] }]) => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath })

          // Create indexes
          indexes.forEach((indexName) => {
            store.createIndex(indexName, indexName, { unique: false })
          })
        }
      })
    }
  })
}

// Generic CRUD operations

// Create or update an item
export async function putItem<T>(storeName: string, item: T): Promise<T> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.put(item)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(item)

    transaction.oncomplete = () => db.close()
  })
}

// Get an item by key
export async function getItem<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)

    transaction.oncomplete = () => db.close()
  })
}

// Get all items from a store
export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    transaction.oncomplete = () => db.close()
  })
}

// Get items by index
export async function getItemsByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)
    const index = store.index(indexName)
    const request = index.getAll(value)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    transaction.oncomplete = () => db.close()
  })
}

// Delete an item
export async function deleteItem(storeName: string, key: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.delete(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

// Clear a store
export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)
    const request = store.clear()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

// Check if database exists
export async function doesDatabaseExist(): Promise<boolean> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME)
    let exists = true

    request.onupgradeneeded = () => {
      exists = false
      request.transaction?.abort()
    }

    request.onsuccess = () => {
      request.result.close()
      resolve(exists)
    }

    request.onerror = () => {
      resolve(false)
    }
  })
}
