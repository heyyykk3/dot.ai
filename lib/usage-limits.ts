import { doc, getDoc, setDoc, increment, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

// Usage limits
const LIMITS = {
  FREE_TIER: {
    DAILY_MESSAGES: 100,
    DAILY_IMAGES: 10,
    HISTORY_DAYS: 7,
  },
  GUEST_TIER: {
    DAILY_MESSAGES: 20,
    DAILY_IMAGES: 3,
    SESSION_DURATION_HOURS: 24,
  },
}

// Check if user has reached their daily message limit
export async function checkMessageLimit(userId: string | null, isGuest: boolean): Promise<boolean> {
  if (!userId && !isGuest) return false

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isGuest) {
      // For guest users, use localStorage to track usage
      try {
        const guestUsage = localStorage.getItem("guestUsage")
        if (guestUsage) {
          const usage = JSON.parse(guestUsage)
          const usageDate = new Date(usage.date)
          usageDate.setHours(0, 0, 0, 0)

          // Reset if it's a new day
          if (usageDate.getTime() !== today.getTime()) {
            localStorage.setItem(
              "guestUsage",
              JSON.stringify({
                date: today.toISOString(),
                messages: 1,
                images: 0,
              }),
            )
            return true
          }

          // Check if limit reached
          if (usage.messages >= LIMITS.GUEST_TIER.DAILY_MESSAGES) {
            return false
          }

          // Increment usage
          usage.messages += 1
          localStorage.setItem("guestUsage", JSON.stringify(usage))
          return true
        } else {
          // First usage
          localStorage.setItem(
            "guestUsage",
            JSON.stringify({
              date: today.toISOString(),
              messages: 1,
              images: 0,
            }),
          )
          return true
        }
      } catch (e) {
        console.error("Error checking guest message limit:", e)
        // Allow on error to prevent blocking users
        return true
      }
    } else if (userId) {
      // For registered users, use Firestore
      try {
        const usageRef = doc(db, "usage", userId)
        const usageDoc = await getDoc(usageRef)

        if (usageDoc.exists()) {
          const usage = usageDoc.data()
          const lastUpdate = usage.lastUpdate?.toDate() || new Date(0)
          lastUpdate.setHours(0, 0, 0, 0)

          // Reset if it's a new day
          if (lastUpdate.getTime() !== today.getTime()) {
            await setDoc(usageRef, {
              dailyMessages: 1,
              dailyImages: 0,
              lastUpdate: Timestamp.now(),
            })
            return true
          }

          // Check if limit reached
          if (usage.dailyMessages >= LIMITS.FREE_TIER.DAILY_MESSAGES) {
            return false
          }

          // Increment usage
          await setDoc(
            usageRef,
            {
              dailyMessages: increment(1),
              lastUpdate: Timestamp.now(),
            },
            { merge: true },
          )
          return true
        } else {
          // First usage
          await setDoc(usageRef, {
            dailyMessages: 1,
            dailyImages: 0,
            lastUpdate: Timestamp.now(),
          })
          return true
        }
      } catch (e) {
        console.error("Error checking user message limit:", e)
        // Allow on error to prevent blocking users
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking message limit:", error)
    return true // Allow on error to prevent blocking users
  }
}

// Check if user has reached their daily image generation limit
export async function checkImageLimit(userId: string | null, isGuest: boolean): Promise<boolean> {
  if (!userId && !isGuest) return false

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isGuest) {
      // For guest users, use localStorage to track usage
      const guestUsage = localStorage.getItem("guestUsage")
      if (guestUsage) {
        const usage = JSON.parse(guestUsage)
        const usageDate = new Date(usage.date)
        usageDate.setHours(0, 0, 0, 0)

        // Reset if it's a new day
        if (usageDate.getTime() !== today.getTime()) {
          localStorage.setItem(
            "guestUsage",
            JSON.stringify({
              date: today.toISOString(),
              messages: 0,
              images: 1,
            }),
          )
          return true
        }

        // Check if limit reached
        if (usage.images >= LIMITS.GUEST_TIER.DAILY_IMAGES) {
          return false
        }

        // Increment usage
        usage.images += 1
        localStorage.setItem("guestUsage", JSON.stringify(usage))
        return true
      } else {
        // First usage
        localStorage.setItem(
          "guestUsage",
          JSON.stringify({
            date: today.toISOString(),
            messages: 0,
            images: 1,
          }),
        )
        return true
      }
    } else if (userId) {
      // For registered users, use Firestore
      const usageRef = doc(db, "usage", userId)
      const usageDoc = await getDoc(usageRef)

      if (usageDoc.exists()) {
        const usage = usageDoc.data()
        const lastUpdate = usage.lastUpdate?.toDate() || new Date(0)
        lastUpdate.setHours(0, 0, 0, 0)

        // Reset if it's a new day
        if (lastUpdate.getTime() !== today.getTime()) {
          await setDoc(usageRef, {
            dailyMessages: 0,
            dailyImages: 1,
            lastUpdate: Timestamp.now(),
          })
          return true
        }

        // Check if limit reached
        if (usage.dailyImages >= LIMITS.FREE_TIER.DAILY_IMAGES) {
          return false
        }

        // Increment usage
        await setDoc(
          usageRef,
          {
            dailyImages: increment(1),
            lastUpdate: Timestamp.now(),
          },
          { merge: true },
        )
        return true
      } else {
        // First usage
        await setDoc(usageRef, {
          dailyMessages: 0,
          dailyImages: 1,
          lastUpdate: Timestamp.now(),
        })
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking image limit:", error)
    return true // Allow on error to prevent blocking users
  }
}

// Get usage limits based on user tier
export function getUsageLimits(isGuest: boolean) {
  return isGuest ? LIMITS.GUEST_TIER : LIMITS.FREE_TIER
}

// Check if guest session is expired
export function isGuestSessionExpired(): boolean {
  const guestSession = localStorage.getItem("guestSession")
  if (!guestSession) return false

  const session = JSON.parse(guestSession)
  const sessionStart = new Date(session.startTime)
  const now = new Date()

  // Check if session is older than the limit
  const hoursDiff = (now.getTime() - sessionStart.getTime()) / (1000 * 60 * 60)
  return hoursDiff > LIMITS.GUEST_TIER.SESSION_DURATION_HOURS
}

// Initialize or refresh guest session
export function initGuestSession() {
  localStorage.setItem(
    "guestSession",
    JSON.stringify({
      startTime: new Date().toISOString(),
      chatId: crypto.randomUUID(),
    }),
  )
}

// Get current guest chat ID
export function getGuestChatId(): string {
  const guestSession = localStorage.getItem("guestSession")
  if (!guestSession) {
    initGuestSession()
    return getGuestChatId()
  }

  return JSON.parse(guestSession).chatId
}
