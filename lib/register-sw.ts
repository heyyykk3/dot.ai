export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    })
  }
}

// Function to store a message offline
export async function storeMessageOffline(message: any) {
  if (!("indexedDB" in window)) {
    console.error("IndexedDB not supported")
    return
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dotAiOfflineDB", 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result
      if (!db.objectStoreNames.contains("offlineMessages")) {
        db.createObjectStore("offlineMessages", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBRequest).result
      const transaction = db.transaction(["offlineMessages"], "readwrite")
      const store = transaction.objectStore("offlineMessages")

      const addRequest = store.add(message)

      addRequest.onsuccess = () => {
        resolve(true)
      }

      addRequest.onerror = () => {
        reject(addRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Function to get offline messages
export async function getOfflineMessages() {
  if (!("indexedDB" in window)) {
    console.error("IndexedDB not supported")
    return []
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dotAiOfflineDB", 1)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBRequest).result
      if (!db.objectStoreNames.contains("offlineMessages")) {
        db.createObjectStore("offlineMessages", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      const db = (event.target as IDBRequest).result
      const transaction = db.transaction(["offlineMessages"], "readonly")
      const store = transaction.objectStore("offlineMessages")

      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result)
      }

      getAllRequest.onerror = () => {
        reject(getAllRequest.error)
      }
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Function to request sync when online
export function requestSync() {
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register("sync-messages").catch((error) => {
        console.error("Sync registration failed:", error)
      })
    })
  }
}

// Function to check if online
export function isOnline() {
  return navigator.onLine
}
