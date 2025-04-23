// AI Horde API utilities with Hugging Face fallback

// Check if AI Horde is available and has reasonable queue size
export async function isAIHordeAvailable(): Promise<boolean> {
  try {
    const status = await checkAIHordeStatus()
    // Consider AI Horde unavailable if queue is too large (>80) or no workers
    return status.isOnline && status.workerCount > 0 && status.queueSize <= 250
  } catch (error) {
    console.error("Error checking AI Horde availability:", error)
    return false
  }
}

// Function to generate an image using Together AI with AI Horde fallback
export async function generateImage(
  prompt: string,
  model = "absolute_reality",
  width = 512,
  height = 512,
  steps = 30,
  onProgress?: (progress: number) => void,
): Promise<string> {
  try {
    // First try with Together AI
    console.log("Starting image generation with Together AI...")

    try {
      return await generateImageWithTogetherAI(prompt, width, height)
    } catch (error) {
      console.error("Error generating image with Together AI:", error)
      console.log("Falling back to AI Horde...")
    }

    // Check if AI Horde is available with reasonable queue
    const isAvailable = await isAIHordeAvailable()

    if (!isAvailable) {
      throw new Error("AI Horde unavailable or queue too large")
    }

    console.log("Starting image generation with AI Horde...")

    // Step 1: Submit the generation request via our server-side API
    console.log("Submitting generation request to AI Horde...")
    const generationResponse = await fetch("/api/ai-horde", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        model: model,
        width: width,
        height: height,
        steps: steps,
      }),
    })

    if (!generationResponse.ok) {
      const errorData = await generationResponse.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(`AI Horde API error: ${errorData.error || "Unknown error"}`)
    }

    const generationData = await generationResponse.json()
    const requestId = generationData.id

    if (!requestId) {
      throw new Error("Failed to get request ID from AI Horde")
    }

    console.log(`Generation request submitted successfully. Request ID: ${requestId}`)

    // Step 2: Poll for status until the generation is complete
    let imageUrl = ""
    let isComplete = false
    let attempts = 0
    const maxAttempts = 60 // Maximum polling attempts (5 minutes with 5-second intervals)

    console.log("Polling for generation status...")
    while (!isComplete && attempts < maxAttempts) {
      attempts++
      await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds between polls

      const statusResponse = await fetch(`/api/ai-horde?id=${requestId}&type=status`)

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(`AI Horde status check error: ${errorData.error || "Unknown error"}`)
      }

      const statusData = await statusResponse.json()
      console.log("Status check response:", statusData)

      // Update progress if callback provided
      if (
        onProgress &&
        statusData.waiting !== undefined &&
        statusData.processing !== undefined &&
        statusData.finished !== undefined
      ) {
        const total = statusData.waiting + statusData.processing + statusData.finished
        if (total > 0) {
          const progress = Math.round((statusData.finished / total) * 100)
          console.log(`Generation progress: ${progress}%`)
          onProgress(progress)
        }
      }

      // Check if generation is done
      if (statusData.done && statusData.finished > 0) {
        isComplete = true
        console.log("Generation complete, fetching result...")

        // Step 3: Get the generated image
        const resultResponse = await fetch(`/api/ai-horde?id=${requestId}&type=result`)

        if (!resultResponse.ok) {
          const errorData = await resultResponse.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(`AI Horde result fetch error: ${errorData.error || "Unknown error"}`)
        }

        const resultData = await resultResponse.json()
        console.log("Result data received:", resultData)

        if (resultData.generations && resultData.generations.length > 0) {
          // Get the image URL from the first generation
          imageUrl = resultData.generations[0].img

          if (!imageUrl) {
            throw new Error("No image URL in the generation result")
          }

          console.log("Image URL retrieved successfully")
        } else {
          throw new Error("No generations found in the result")
        }
      }
    }

    if (!isComplete) {
      throw new Error("AI Horde image generation timed out")
    }

    return imageUrl
  } catch (error) {
    console.error("Error generating image:", error)
    throw new Error(`Failed to generate image: ${(error as Error).message}`)
  }
}

// Function to generate image with Together AI as primary provider
async function generateImageWithTogetherAI(prompt: string, width = 1024, height = 1024): Promise<string> {
  try {
    console.log("Generating image with Together AI...")
    console.log("Prompt being sent to Together AI:", prompt)

    // Try with FLUX.1-schnell-Free first
    let model = "black-forest-labs/FLUX.1-schnell-Free"

    const response = await fetch("/api/together", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        width: width,
        height: height,
        response_format: { type: "image_url" },
      }),
    })

    if (!response.ok) {
      console.warn(`Error with ${model}, trying fallback model...`)

      // Try with stable-diffusion-xl as fallback
      model = "stabilityai/stable-diffusion-xl-base-1.0"

      const fallbackResponse = await fetch("/api/together", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          prompt: prompt,
          width: width,
          height: height,
          response_format: { type: "image_url" },
        }),
      })

      if (!fallbackResponse.ok) {
        const errorData = await fallbackResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("Together AI API error details:", errorData)
        throw new Error(`Together AI image generation error: ${errorData.error || "Unknown error"}`)
      }

      const fallbackData = await fallbackResponse.json()

      if (fallbackData && fallbackData.choices && fallbackData.choices.length > 0) {
        return fallbackData.choices[0].image_url || fallbackData.choices[0].text
      } else {
        throw new Error("Invalid response from Together AI API")
      }
    }

    const data = await response.json()

    if (data && data.choices && data.choices.length > 0) {
      console.log("Together AI response:", data)
      return data.choices[0].image_url || data.choices[0].text
    } else {
      console.error("Invalid response from Together AI API:", data)
      throw new Error("Invalid response from Together AI API")
    }
  } catch (error) {
    console.error("Error generating image with Together AI:", error)
    throw new Error(`Failed to generate image: ${(error as Error).message}`)
  }
}

// Function to check AI Horde status
export async function checkAIHordeStatus(): Promise<{
  isOnline: boolean
  workerCount: number
  queueSize: number
}> {
  try {
    // Add a timeout to the fetch request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(`/api/ai-horde/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`AI Horde status check failed with status: ${response.status}`)
      return { isOnline: false, workerCount: 0, queueSize: 0 }
    }

    // Safely parse the JSON response
    let data
    try {
      const text = await response.text()
      // Check if the response is empty
      if (!text.trim()) {
        console.error("Empty response from AI Horde status API")
        return { isOnline: false, workerCount: 0, queueSize: 0 }
      }

      data = JSON.parse(text)
    } catch (parseError) {
      console.error("Failed to parse AI Horde status response:", parseError)
      return { isOnline: false, workerCount: 0, queueSize: 0 }
    }

    // Validate the data structure
    if (typeof data !== "object" || data === null) {
      console.error("Invalid data format from AI Horde status API:", data)
      return { isOnline: false, workerCount: 0, queueSize: 0 }
    }

    return {
      isOnline: Boolean(data.isOnline),
      workerCount: Number(data.workerCount) || 0,
      queueSize: Number(data.queueSize) || 0,
    }
  } catch (error) {
    console.error("Error checking AI Horde status:", error)
    return { isOnline: false, workerCount: 0, queueSize: 0 }
  }
}

// Add this function to the existing file
export async function analyzeImageWithAIHorde(imageUrl: string, text: string): Promise<string> {
  // Implementation of AI Horde image analysis
  // This is a placeholder - you would implement the actual AI Horde API call here
  try {
    const apiKey = process.env.AI_HORDE_API_KEY || ""

    // First, we need to check if the image is accessible
    try {
      const imageResponse = await fetch(imageUrl, { method: "HEAD" })
      if (!imageResponse.ok) {
        throw new Error(`Image URL is not accessible: ${imageUrl}`)
      }
    } catch (error) {
      console.error("Error accessing image URL:", error)
      throw new Error(`Could not access image URL: ${error.message}`)
    }

    // Now we can send the request to AI Horde
    const response = await fetch("https://stablehorde.net/api/v2/interrogate/async", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        url: imageUrl,
        forms: [
          {
            name: "caption",
            payload: { text_prompt: text || "Describe this image in detail" },
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`AI Horde API error: ${response.status}`)
    }

    const data = await response.json()
    const requestId = data.id

    // Poll for results
    let result = null
    let attempts = 0
    const maxAttempts = 30

    while (!result && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Wait 2 seconds

      const statusResponse = await fetch(`https://stablehorde.net/api/v2/interrogate/status/${requestId}`, {
        headers: { apikey: apiKey },
      })

      if (!statusResponse.ok) {
        throw new Error(`AI Horde status check error: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()

      if (statusData.done) {
        result = statusData.forms[0].result
        break
      }

      attempts++
    }

    if (!result) {
      throw new Error("AI Horde analysis timed out")
    }

    return result
  } catch (error) {
    console.error("Error analyzing image with AI Horde:", error)
    return `I couldn't analyze the image with AI Horde. Error: ${error.message}`
  }
}
