// Service Worker for dot.ai
const CACHE_NAME = "dot-ai-cache-v2"
const OFFLINE_URL = "/offline"

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/favicon-32x32.png",
  "/icons/favicon-16x16.png",
  "/icons/apple-touch-icon.png",
  "/images/ios-install.png",
  "/images/logo.png",
]

// Install event - precache key resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_ASSETS).catch((error) => {
          console.error("Failed to cache assets:", error)
        }),
      )
      .then(() => self.skipWaiting()),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME
            })
            .map((cacheName) => {
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Helper function to determine if a request is an API call
function isApiRequest(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith("/api/") || url.hostname === "openrouter.ai" || url.hostname === "aihorde.net"
}

// Helper function to determine if a request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
}

// Helper function to determine if a request is for the ping endpoint
function isPingRequest(request) {
  const url = new URL(request.url)
  return url.pathname === "/api/ping"
}

// Fetch event - network first for API, cache first for static assets
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests except for specific APIs we use
  if (
    !event.request.url.startsWith(self.location.origin) &&
    !event.request.url.includes("openrouter.ai") &&
    !event.request.url.includes("aihorde.net")
  ) {
    return
  }

  // For ping requests, respond with a simple JSON even when offline
  if (isPingRequest(event.request)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            status: "offline",
            timestamp: new Date().toISOString(),
            message: "You are currently offline",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        )
      }),
    )
    return
  }

  // For API requests, use network first strategy with timeout
  if (isApiRequest(event.request)) {
    event.respondWith(
      Promise.race([
        // Network request with 10 second timeout
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error("Network timeout")), 10000)
          fetch(event.request).then(resolve, reject)
        }),
        // Fallback to cache or offline page after timeout
        new Promise((resolve) => {
          setTimeout(() => {
            caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) {
                resolve(cachedResponse)
              } else {
                resolve(caches.match(OFFLINE_URL))
              }
            })
          }, 10000)
        }),
      ]).catch(() => {
        return caches.match(OFFLINE_URL)
      }),
    )
    return
  }

  // For static assets, use cache first strategy
  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches
        .match(event.request)
        .then((response) => {
          return (
            response ||
            fetch(event.request).then((fetchResponse) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, fetchResponse.clone())
                return fetchResponse
              })
            })
          )
        })
        .catch(() => {
          // If both cache and network fail, show offline page
          return caches.match(OFFLINE_URL)
        }),
    )
    return
  }

  // For HTML navigation requests, use network first strategy
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      }),
    )
    return
  }

  // Default: try network, fall back to cache, then offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for future offline use
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return caches.match(OFFLINE_URL)
        })
      }),
  )
})

// Background sync for offline messages
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages())
  }
})

// Function to sync offline messages
async function syncMessages() {
  try {
    const db = await openDB()
    const offlineMessages = await db.getAll("offlineMessages")

    for (const message of offlineMessages) {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        })

        if (response.ok) {
          await db.delete("offlineMessages", message.id)
        }
      } catch (error) {
        console.error("Failed to sync message:", error)
      }
    }
  } catch (error) {
    console.error("Error syncing messages:", error)
  }
}

// Open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("dotAiOfflineDB", 1)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("offlineMessages")) {
        db.createObjectStore("offlineMessages", { keyPath: "id" })
      }
    }

    request.onsuccess = (event) => {
      const db = event.target.result
      resolve({
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly")
            const store = transaction.objectStore(storeName)
            const request = store.getAll()

            request.onsuccess = () => resolve(request.result)
            request.onerror = () => reject(request.error)
          })
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readwrite")
            const store = transaction.objectStore(storeName)
            const request = store.delete(id)

            request.onsuccess = () => resolve()
            request.onerror = () => reject(request.error)
          })
        },
      })
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

// Listen for push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json()

  const options = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/badge-72x72.png",
    data: {
      url: data.url || "/",
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow(event.notification.data.url))
})
