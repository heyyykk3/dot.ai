export function getOpenRouterHeaders() {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.error("OpenRouter API key is missing. Please check your environment variables.")
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://dot.ai", // Add your domain for better request tracking
    "X-Title": "dot.ai", // Add your app name for better request tracking
  }
}

// Model categories for better organization
export type ModelCategory = "coding" | "general" | "research" | "vision" | "creative"

// Model information interface
export interface ModelInfo {
  id: string
  name: string
  provider: string
  categories: ModelCategory[]
  tags: string[]
  description: string
  contextWindow: number
  strengths: string[]
  weaknesses?: string[]
  speed: "fast" | "medium" | "slow"
}

// Update the getDefaultModel function to use Together AI models as defaults for research and image
export function getDefaultModel(mode: string): string {
  switch (mode) {
    case "personal":
      return "deepseek/deepseek-chat-v3-0324:free" // Keep DeepSeek for personal
    case "code":
      return "deepseek/deepseek-chat-v3-0324:free" // Keep DeepSeek for code
    case "research":
      return "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free" // Use Together AI model for research
    case "image":
      return "black-forest-labs/FLUX.1-schnell-Free" // Use FLUX.1 for image generation
    default:
      return "deepseek/deepseek-chat-v3-0324:free" // Default fallback
  }
}

// Update the getFallbackModel function to include Together AI models
export function getFallbackModel(primaryModel: string): string {
  // Map of primary models to their fallbacks
  const fallbacks: Record<string, string> = {
    "google/gemini-2.5-pro-exp-03-25:free": "deepseek/deepseek-chat-v3-0324:free",
    "deepseek/deepseek-chat-v3-0324:free": "mistralai/mistral-small-3.1-24b-instruct:free",
    "deepseek/deepseek-r1:free": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free", // Add Together AI model as fallback
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free": "deepseek/deepseek-r1:free", // Add fallback for Together AI model
    "google/gemini-pro-vision:free": "meta-llama/Llama-Vision-Free", // Use Together AI vision model as fallback
    "meta-llama/Llama-Vision-Free": "qwen/qwen2.5-vl-3b-instruct:free", // Add fallback for Together AI vision model
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": "mistralai/Mistral-7B-Instruct-v0.2", // Add fallback for Together AI model
  }

  return fallbacks[primaryModel] || "deepseek/deepseek-chat:free" // Default fallback
}

// Update the AVAILABLE_MODELS to include Together AI models
export const AVAILABLE_MODELS = {
  // DeepSeek models (prioritized to avoid rate limits)
  deepseek: [
    "deepseek/deepseek-chat-v3-0324:free",
    "deepseek/deepseek-chat:free",
    "deepseek/deepseek-r1:free",
    "deepseek/deepseek-r1-zero:free",
    "deepseek/deepseek-v3-base:free",
    "deepseek/deepseek-r1-distill-qwen-32b:free",
    "deepseek/deepseek-r1-distill-llama-70b:free",
  ],

  // Google models
  google: [
    "google/gemini-2.5-pro-exp-03-25:free",
    "google/gemini-pro:free",
    "google/gemini-2.0-pro-exp-02-05:free",
    "google/gemini-2.0-flash-thinking-exp:free",
    "google/gemini-2.0-flash-thinking-exp-1219:free",
    "google/gemma-3-1b-it:free",
    "google/gemma-3-4b-it:free",
    "google/gemma-3-27b-it:free",
  ],

  // Together AI models
  together: [
    "black-forest-labs/FLUX.1-schnell-Free", // Add the new image generation model
    "stabilityai/stable-diffusion-xl-base-1.0", // Add SDXL as fallback
    "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
    "meta-llama/Llama-Vision-Free",
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "codellama/CodeLlama-7b-Instruct-hf",
    "llava/Llava-1.5-7b-hf",
  ],

  // Other free models
  other: [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "mistralai/mistral-small-24b-instruct-2501:free",
    "qwen/qwen2.5-vl-3b-instruct:free",
    "qwen/qwen2.5-vl-72b-instruct:free",
    "allenai/molmo-7b-d:free",
    "bytedance-research/ui-tars-72b:free",
    "open-r1/olympiccoder-7b:free",
    "open-r1/olympiccoder-32b:free",
    "rekaai/reka-flash-3:free",
    "moonshotai/moonlight-16b-a3b-instruct:free",
    "nousresearch/deephermes-3-llama-3-8b-preview:free",
    "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
    "cognitivecomputations/dolphin3.0-mistral-24b:free",
    "sophosympatheia/rogue-rose-103b-v0.2:free",
    "huggingfaceh4/zephyr-7b-beta:free",
  ],

  // Vision models for image analysis
  vision: [
    "meta-llama/Llama-Vision-Free", // Add Together AI vision model
    "qwen/qwen2.5-vl-72b-instruct:free",
    "qwen/qwen2.5-vl-3b-instruct:free",
    "google/gemini-pro-vision:free",
    "llava/Llava-1.5-7b-hf", // Add another Together AI vision model
  ],
}

const MODEL_DETAILS: { [modelId: string]: Partial<ModelInfo> } = {
  "deepseek/deepseek-chat-v3-0324:free": {
    name: "DeepSeek Chat v3",
    provider: "DeepSeek",
    categories: ["general", "coding"],
    tags: ["free", "recommended"],
    description: "DeepSeek Chat model v3",
    contextWindow: 16384,
    strengths: ["Coding", "General Knowledge"],
    speed: "fast",
  },
  "deepseek/deepseek-chat:free": {
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    categories: ["general", "coding"],
    tags: ["free"],
    description: "DeepSeek Chat model",
    contextWindow: 8192,
    strengths: ["Coding", "General Knowledge"],
    speed: "fast",
  },
  "deepseek/deepseek-r1:free": {
    name: "DeepSeek R1",
    provider: "DeepSeek",
    categories: ["research", "coding"],
    tags: ["free"],
    description: "DeepSeek R1 model",
    contextWindow: 8192,
    strengths: ["Research", "Coding"],
    speed: "medium",
  },
  "deepseek/deepseek-r1-zero:free": {
    name: "DeepSeek R1 Zero",
    provider: "DeepSeek",
    categories: ["research", "coding"],
    tags: ["free"],
    description: "DeepSeek R1 Zero model",
    contextWindow: 8192,
    strengths: ["Research", "Coding"],
    speed: "medium",
  },
  "deepseek/deepseek-v3-base:free": {
    name: "DeepSeek v3 Base",
    provider: "DeepSeek",
    categories: ["general", "coding"],
    tags: ["free"],
    description: "DeepSeek v3 Base model",
    contextWindow: 16384,
    strengths: ["Coding", "General Knowledge"],
    speed: "fast",
  },
  "deepseek/deepseek-r1-distill-qwen-32b:free": {
    name: "DeepSeek R1 Distill Qwen 32B",
    provider: "DeepSeek",
    categories: ["research", "coding"],
    tags: ["free"],
    description: "DeepSeek R1 Distill Qwen 32B model",
    contextWindow: 8192,
    strengths: ["Research", "Coding"],
    speed: "medium",
  },
  "deepseek/deepseek-r1-distill-llama-70b:free": {
    name: "DeepSeek R1 Distill Llama 70B",
    provider: "DeepSeek",
    categories: ["research", "coding"],
    tags: ["free"],
    description: "DeepSeek R1 Distill Llama 70B model",
    contextWindow: 8192,
    strengths: ["Research", "Coding"],
    speed: "medium",
  },
  "google/gemini-2.5-pro-exp-03-25:free": {
    name: "Gemini 2.5 Pro",
    provider: "Google",
    categories: ["general"],
    tags: ["free", "recommended"],
    description: "Google Gemini Pro model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemini-pro:free": {
    name: "Gemini Pro",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemini Pro model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemini-2.0-pro-exp-02-05:free": {
    name: "Gemini 2.0 Pro",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemini Pro model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemini-2.0-flash-thinking-exp:free": {
    name: "Gemini 2.0 Flash Thinking",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemini Flash Thinking model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemini-2.0-flash-thinking-exp-1219:free": {
    name: "Gemini 2.0 Flash Thinking",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemini Flash Thinking model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemma-3-1b-it:free": {
    name: "Gemma 3 1B",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemma model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemma-3-4b-it:free": {
    name: "Gemma 3 4B",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemma model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemma-3-27b-it:free": {
    name: "Gemma 3 27B",
    provider: "Google",
    categories: ["general"],
    tags: ["free"],
    description: "Google Gemma model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free": {
    name: "DeepSeek R1 Distill Llama 70B",
    provider: "Together AI",
    categories: ["research", "coding"],
    tags: ["free", "recommended"],
    description: "DeepSeek R1 Distill Llama 70B model",
    contextWindow: 8192,
    strengths: ["Research", "Coding"],
    speed: "medium",
  },
  "meta-llama/Llama-Vision-Free": {
    name: "Llama Vision",
    provider: "Together AI",
    categories: ["vision"],
    tags: ["free", "recommended"],
    description: "Llama Vision model",
    contextWindow: 4096,
    strengths: ["Image Analysis"],
    speed: "medium",
  },
  "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": {
    name: "Llama 3.3 70B Instruct Turbo",
    provider: "Together AI",
    categories: ["general"],
    tags: ["free", "recommended"],
    description: "Llama 3.3 70B Instruct Turbo model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "codellama/CodeLlama-7b-Instruct-hf": {
    name: "CodeLlama 7B Instruct",
    provider: "Together AI",
    categories: ["coding"],
    tags: ["free"],
    description: "CodeLlama 7B Instruct model",
    contextWindow: 4096,
    strengths: ["Coding"],
    speed: "fast",
  },
  "llava/Llava-1.5-7b-hf": {
    name: "Llava 1.5 7B",
    provider: "Together AI",
    categories: ["vision"],
    tags: ["free"],
    description: "Llava 1.5 7B model",
    contextWindow: 4096,
    strengths: ["Image Analysis"],
    speed: "medium",
  },
  "mistralai/mistral-small-3.1-24b-instruct:free": {
    name: "Mistral Small 3.1 24B Instruct",
    provider: "Mistral AI",
    categories: ["general"],
    tags: ["free"],
    description: "Mistral Small 3.1 24B Instruct model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "mistralai/mistral-small-24b-instruct-2501:free": {
    name: "Mistral Small 24B Instruct",
    provider: "Mistral AI",
    categories: ["general"],
    tags: ["free"],
    description: "Mistral Small 24B Instruct model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "qwen/qwen2.5-vl-3b-instruct:free": {
    name: "Qwen VL 3B Instruct",
    provider: "Qwen",
    categories: ["vision"],
    tags: ["free"],
    description: "Qwen VL 3B Instruct model",
    contextWindow: 8192,
    strengths: ["Image Analysis"],
    speed: "medium",
  },
  "qwen/qwen2.5-vl-72b-instruct:free": {
    name: "Qwen VL 72B Instruct",
    provider: "Qwen",
    categories: ["vision"],
    tags: ["free"],
    description: "Qwen VL 72B Instruct model",
    contextWindow: 32768,
    strengths: ["Image Analysis"],
    speed: "medium",
  },
  "allenai/molmo-7b-d:free": {
    name: "Molmo 7B",
    provider: "Allen AI",
    categories: ["general"],
    tags: ["free"],
    description: "Molmo 7B model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "medium",
  },
  "bytedance-research/ui-tars-72b:free": {
    name: "UI TARS 72B",
    provider: "Bytedance Research",
    categories: ["general"],
    tags: ["free"],
    description: "UI TARS 72B model",
    contextWindow: 32768,
    strengths: ["General Knowledge"],
    speed: "medium",
  },
  "open-r1/olympiccoder-7b:free": {
    name: "OlympicCoder 7B",
    provider: "Open R1",
    categories: ["coding"],
    tags: ["free"],
    description: "OlympicCoder 7B model",
    contextWindow: 8192,
    strengths: ["Coding"],
    speed: "fast",
  },
  "open-r1/olympiccoder-32b:free": {
    name: "OlympicCoder 32B",
    provider: "Open R1",
    categories: ["coding"],
    tags: ["free"],
    description: "OlympicCoder 32B model",
    contextWindow: 8192,
    strengths: ["Coding"],
    speed: "fast",
  },
  "rekaai/reka-flash-3:free": {
    name: "Reka Flash 3",
    provider: "Reka AI",
    categories: ["general"],
    tags: ["free"],
    description: "Reka Flash 3 model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "moonshotai/moonlight-16b-a3b-instruct:free": {
    name: "Moonlight 16B",
    provider: "Moonshot AI",
    categories: ["general"],
    tags: ["free"],
    description: "Moonlight 16B model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "nousresearch/deephermes-3-llama-3-8b-preview:free": {
    name: "DeepHermes 3",
    provider: "Nous Research",
    categories: ["general"],
    tags: ["free"],
    description: "DeepHermes 3 model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "cognitivecomputations/dolphin3.0-r1-mistral-24b:free": {
    name: "Dolphin 3.0 R1",
    provider: "Cognitive Computations",
    categories: ["general"],
    tags: ["free"],
    description: "Dolphin 3.0 R1 model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "cognitivecomputations/dolphin3.0-mistral-24b:free": {
    name: "Dolphin 3.0",
    provider: "Cognitive Computations",
    categories: ["general"],
    tags: ["free"],
    description: "Dolphin 3.0 model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "sophosympatheia/rogue-rose-103b-v0.2:free": {
    name: "Rogue Rose 103B",
    provider: "Sophosympatheia",
    categories: ["general"],
    tags: ["free"],
    description: "Rogue Rose 103B model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "huggingfaceh4/zephyr-7b-beta:free": {
    name: "Zephyr 7B",
    provider: "Hugging Face",
    categories: ["general"],
    tags: ["free"],
    description: "Zephyr 7B model",
    contextWindow: 8192,
    strengths: ["General Knowledge"],
    speed: "fast",
  },
  "google/gemini-pro-vision:free": {
    name: "Gemini Pro Vision",
    provider: "Google",
    categories: ["vision"],
    tags: ["free"],
    description: "Google Gemini Pro Vision model",
    contextWindow: 12288,
    strengths: ["Image Analysis"],
    speed: "medium",
  },
  "black-forest-labs/FLUX.1-schnell-Free": {
    name: "FLUX.1 Schnell",
    provider: "Together AI",
    categories: ["creative", "image"],
    tags: ["free", "recommended"],
    description: "Fast image generation model",
    contextWindow: 4096,
    strengths: ["Image Generation", "Creative"],
    speed: "fast",
  },
  "stabilityai/stable-diffusion-xl-base-1.0": {
    name: "Stable Diffusion XL",
    provider: "Together AI",
    categories: ["creative", "image"],
    tags: ["free"],
    description: "Stable Diffusion XL image generation model",
    contextWindow: 4096,
    strengths: ["Image Generation", "Creative"],
    speed: "medium",
  },
}

// Get model details with fallback to basic info
export function getModelDetails(modelId: string): Partial<ModelInfo> {
  return (
    MODEL_DETAILS[modelId] || {
      categories: ["general"],
      tags: [],
      description: "AI language model",
      speed: "medium",
    }
  )
}

// Function to get recommended models based on mode
export function getRecommendedModels(mode: string): string[] {
  switch (mode) {
    case "personal":
      return [
        "deepseek/deepseek-chat-v3-0324:free",
        "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        "google/gemini-2.5-pro-exp-03-25:free",
      ]
    case "code":
      return ["deepseek/deepseek-chat-v3-0324:free", "open-r1/olympiccoder-32b:free"]
    case "research":
      return ["deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free", "deepseek/deepseek-r1:free"]
    case "image":
      return [
        "black-forest-labs/FLUX.1-schnell-Free",
        "stabilityai/stable-diffusion-xl-base-1.0",
        "meta-llama/Llama-Vision-Free",
      ]
    default:
      return ["deepseek/deepseek-chat-v3-0324:free"]
  }
}
