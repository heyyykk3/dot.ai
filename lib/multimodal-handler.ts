import { getOpenRouterHeaders } from "./openrouter"
import { uploadImage, getDataUrlFromFile } from "@/lib/firebase-storage"
import { auth } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"

// Supported file types
export type FileType = "image" | "audio" | "pdf"

// File metadata interface
export interface FileMetadata {
  id: string
  type: FileType
  url: string
  name: string
  size: number
  timestamp: string
}

// Process files for multimodal conversations
export async function processFiles(files: File[], onProgress?: (progress: number) => void): Promise<FileMetadata[]> {
  const processedFiles: FileMetadata[] = []
  let totalProgress = 0

  // Process files in parallel with Promise.all
  await Promise.all(
    files.map(async (file, index) => {
      try {
        const fileType = getFileType(file)
        if (!fileType) throw new Error(`Unsupported file type: ${file.type}`)

        // Upload file to storage or convert to data URL
        let url: string
        if (auth.currentUser) {
          url = await uploadImage(file, (progress) => {
            // Calculate overall progress
            if (onProgress) {
              const fileProgress = progress / 100
              const fileWeight = 1 / files.length
              totalProgress = files.length > 1 ? totalProgress + fileProgress * fileWeight : progress
              onProgress(Math.min(Math.round(totalProgress), 99))
            }
          })
        } else {
          url = await getDataUrlFromFile(file)
          if (onProgress) onProgress(Math.min(90, 30 + index * 20))
        }

        // Create file metadata
        const metadata: FileMetadata = {
          id: uuidv4(),
          type: fileType,
          url,
          name: file.name,
          size: file.size,
          timestamp: new Date().toISOString(),
        }

        processedFiles.push(metadata)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        throw error
      }
    }),
  )

  if (onProgress) onProgress(100)
  return processedFiles
}

// Determine file type based on MIME type
function getFileType(file: File): FileType | null {
  if (file.type.startsWith("image/")) return "image"
  if (file.type.startsWith("audio/")) return "audio"
  if (file.type === "application/pdf") return "pdf"
  return null
}

// Format files for OpenRouter API
export function formatFilesForAPI(files: FileMetadata[], message: string): any[] {
  const content: any[] = []

  // Add text content if provided
  if (message.trim()) {
    content.push({
      type: "text",
      text: message,
    })
  }

  // Add file content based on type
  files.forEach((file) => {
    if (file.type === "image") {
      content.push({
        type: "image_url",
        image_url: {
          url: file.url,
          detail: "high", // Request high detail for better analysis
        },
      })
    }
    // For PDF and audio, we include a text reference since OpenRouter doesn't directly support these
    else if (file.type === "pdf") {
      content.push({
        type: "text",
        text: `[PDF Reference: ${file.name}]`,
      })
    } else if (file.type === "audio") {
      content.push({
        type: "text",
        text: `[Audio Reference: ${file.name}]`,
      })
    }
  })

  return content
}

// Extract text from PDF
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // We'll use pdf.js for this, but for now return a placeholder
    return `[PDF content extraction is being processed for ${file.name}]`
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return `[Error extracting text from ${file.name}]`
  }
}

// Transcribe audio to text
export async function transcribeAudio(file: File): Promise<string> {
  try {
    // In a real implementation, you would use a speech-to-text service
    // For now, return a placeholder
    return `[Audio transcription is being processed for ${file.name}]`
  } catch (error) {
    console.error("Error transcribing audio:", error)
    return `[Error transcribing audio from ${file.name}]`
  }
}

// Send multimodal message to OpenRouter
export async function sendMultimodalMessage(content: any[], model: string, systemPrompt: string): Promise<string> {
  try {
    // Determine if we need a vision model
    const hasImages = content.some((item) => item.type === "image_url")
    const modelToUse = hasImages ? "google/gemini-pro-vision:free" : model

    // Enhanced system prompt for image context
    let enhancedSystemPrompt = systemPrompt
    if (hasImages) {
      const imageCount = content.filter((item) => item.type === "image_url").length
      enhancedSystemPrompt += `\n\nThis message includes ${imageCount} image(s). Please analyze the image(s) carefully and refer to them specifically in your response.`
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: getOpenRouterHeaders(),
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: enhancedSystemPrompt,
          },
          {
            role: "user",
            content,
          },
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenRouter API error (${response.status}):`, errorText)
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || "I couldn't generate a response."
  } catch (error) {
    console.error("Error sending multimodal message:", error)
    throw error
  }
}

// Store image references in conversation context
export function storeImageReference(chatId: string, imageUrl: string, description: string): void {
  try {
    // Get existing image references
    const storageKey = `chat_images_${chatId}`
    const existingReferences = JSON.parse(localStorage.getItem(storageKey) || "[]")

    // Add new reference
    existingReferences.push({
      url: imageUrl,
      description,
      timestamp: new Date().toISOString(),
    })

    // Store updated references
    localStorage.setItem(storageKey, JSON.stringify(existingReferences))
  } catch (error) {
    console.error("Error storing image reference:", error)
  }
}

// Get image references for a chat
export function getImageReferences(chatId: string): { url: string; description: string; timestamp: string }[] {
  try {
    const storageKey = `chat_images_${chatId}`
    return JSON.parse(localStorage.getItem(storageKey) || "[]")
  } catch (error) {
    console.error("Error getting image references:", error)
    return []
  }
}
