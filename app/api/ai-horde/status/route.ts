import { NextResponse } from "next/server"

// Base URL for AI Horde API
const AI_HORDE_API_URL = "https://aihorde.net/api/v2"

// Get AI Horde API key
function getAIHordeApiKey() {
  // Use the hardcoded API key provided by the user
  return "z1xlcxq8UtB7IwEpBF7GwA"
}

export async function GET() {
  try {
    // Check if AI Horde is online
    const heartbeatResponse = await fetch(`${AI_HORDE_API_URL}/status/heartbeat`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apikey: getAIHordeApiKey(),
      },
      cache: "no-store",
    })

    if (!heartbeatResponse.ok) {
      console.error(`Heartbeat check failed: ${heartbeatResponse.status}`)
      return NextResponse.json({ isOnline: false, workerCount: 0, queueSize: 0 })
    }

    try {
      // Try to parse the heartbeat response as JSON
      await heartbeatResponse.json()
    } catch (error) {
      console.error("Failed to parse heartbeat response as JSON:", error)
      return NextResponse.json({ isOnline: false, workerCount: 0, queueSize: 0 })
    }

    // Get worker information
    let onlineWorkers = 0
    try {
      const workersResponse = await fetch(`${AI_HORDE_API_URL}/workers?type=image`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apikey: getAIHordeApiKey(),
        },
        cache: "no-store",
      })

      if (workersResponse.ok) {
        const workersData = await workersResponse.json()
        onlineWorkers = Array.isArray(workersData) ? workersData.filter((worker: any) => worker.online).length : 0
      } else {
        console.error(`Workers check failed: ${workersResponse.status}`)
      }
    } catch (error) {
      console.error("Error fetching workers:", error)
    }

    // Get queue information - using the correct endpoint
    let queueSize = 0
    try {
      const performanceResponse = await fetch(`${AI_HORDE_API_URL}/status/performance`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          apikey: getAIHordeApiKey(),
        },
        cache: "no-store",
      })

      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json()
        // The queue size is in the queued_requests field
        queueSize = performanceData.queued_requests || 0
      } else {
        console.error(`Performance check failed: ${performanceResponse.status}`)
      }
    } catch (error) {
      console.error("Error fetching performance info:", error)
    }

    return NextResponse.json({
      isOnline: true,
      workerCount: onlineWorkers,
      queueSize: queueSize,
    })
  } catch (error) {
    console.error("Error checking AI Horde status:", error)
    return NextResponse.json({ isOnline: false, workerCount: 0, queueSize: 0 })
  }
}
