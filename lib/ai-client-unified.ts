import { generateImage as generateAIHordeImage } from "./ai-horde"

/**
 * Unified function to generate images using different AI providers
 * @param prompt The prompt to use for image generation
 * @param options Options for image generation
 * @param maxRetries Maximum number of retries
 * @returns The URL of the generated image
 */
export async function generateImage(
  prompt: string,
  options: { width?: number; height?: number; steps?: number } = {},
  maxRetries = 2,
): Promise<string> {
  let retries = 0
  let lastError: any = null

  while (retries <= maxRetries) {
    try {
      // Try AI Horde first
      console.log(`Attempt ${retries + 1}/${maxRetries + 1}: Generating image with AI Horde`)
      const imageUrl = await generateAIHordeImage(
        prompt,
        "absolute_reality",
        options.width,
        options.height,
        options.steps,
      )
      console.log("Image generated successfully with AI Horde")
      return imageUrl
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error)
      lastError = error
      retries++

      // Wait before retrying (exponential backoff)
      if (retries <= maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries), 10000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // If all attempts fail, throw the last error
  throw new Error(`Failed to generate image after multiple attempts: ${lastError?.message || "Unknown error"}`)
}
