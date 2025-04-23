"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Code, Zap, Brain, Star, Crown, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRecommendedModels } from "@/lib/openrouter"

// Define model categories and tags
export type ModelTag = "fast" | "accurate" | "coding" | "creative" | "reasoning" | "recommended" | "vision" | "research"

interface ModelInfo {
  id: string
  tags: ModelTag[]
  description?: string
  provider?: string
}

// Model metadata to enhance the selector - updated with Together AI models
const MODEL_METADATA: Record<string, ModelInfo> = {
  "deepseek/deepseek-chat-v3-0324:free": {
    id: "deepseek/deepseek-chat-v3-0324:free",
    tags: ["coding", "recommended"],
    description: "Specialized for code generation with excellent performance",
    provider: "DeepSeek",
  },
  "open-r1/olympiccoder-32b:free": {
    id: "open-r1/olympiccoder-32b:free",
    tags: ["coding", "accurate"],
    description: "Powerful code model for complex programming tasks",
    provider: "OlympicCoder",
  },
  "open-r1/olympiccoder-7b:free": {
    id: "open-r1/olympiccoder-7b:free",
    tags: ["coding", "fast"],
    description: "Faster coding model with good performance",
    provider: "OlympicCoder",
  },
  "google/gemini-pro:free": {
    id: "google/gemini-pro:free",
    tags: ["fast", "recommended"],
    description: "Fast and reliable general-purpose model",
    provider: "Google",
  },
  "deepseek/deepseek-r1:free": {
    id: "deepseek/deepseek-r1:free",
    tags: ["reasoning", "recommended"],
    description: "Specialized for research and complex reasoning",
    provider: "DeepSeek",
  },
  "mistralai/mistral-small-3.1-24b-instruct:free": {
    id: "mistralai/mistral-small-3.1-24b-instruct:free",
    tags: ["accurate", "creative"],
    description: "Well-balanced model with good creative capabilities",
    provider: "Mistral AI",
  },
  "rekaai/reka-flash-3:free": {
    id: "rekaai/reka-flash-3:free",
    tags: ["fast", "creative"],
    description: "Quick responses with creative flair",
    provider: "Reka",
  },
  "meta-llama/Llama-Vision-Free": {
    id: "meta-llama/Llama-Vision-Free",
    tags: ["vision", "recommended", "accurate"],
    description: "Meta's Llama Vision model for detailed image analysis",
    provider: "Together AI",
  },
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free": {
    id: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
    tags: ["research", "recommended", "accurate"],
    description: "Powerful research model for in-depth analysis",
    provider: "Together AI",
  },
  "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free": {
    id: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    tags: ["fast", "versatile", "recommended"],
    description: "Versatile large language model with good all-around performance",
    provider: "Together AI",
  },
  "llava/Llava-1.5-7b-hf": {
    id: "llava/Llava-1.5-7b-hf",
    tags: ["vision", "fast"],
    description: "Lightweight vision model for quick image analysis",
    provider: "Together AI",
  },
}

// Get metadata for a model, creating default metadata if not found
const getModelMetadata = (modelId: string): ModelInfo => {
  return (
    MODEL_METADATA[modelId] || {
      id: modelId,
      tags: [],
    }
  )
}

interface ModelSelectorProps {
  currentModel: string
  onModelChange: (model: string) => void
  mode: string
  disabled?: boolean
  isPremium?: boolean
}

export function ModelSelector({
  currentModel,
  onModelChange,
  mode,
  disabled = false,
  isPremium = false,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [models, setModels] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("all")

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
    setModels(getRecommendedModels(mode))
  }, [mode])

  // Update models when mode changes
  useEffect(() => {
    setModels(getRecommendedModels(mode))
  }, [mode])

  // If not mounted (server-side), return a placeholder
  if (!mounted) {
    return (
      <Button variant="outline" className="w-[250px] justify-start" disabled>
        <span className="truncate">Loading models...</span>
      </Button>
    )
  }

  // Filter models by search term and active filter
  const getFilteredModels = () => {
    let filteredModels = models

    // Apply tag filter if not "all"
    if (activeFilter !== "all") {
      filteredModels = filteredModels.filter((modelId) => {
        const metadata = getModelMetadata(modelId)
        return metadata.tags.includes(activeFilter as ModelTag)
      })
    }

    // Apply search filter
    if (searchTerm) {
      filteredModels = filteredModels.filter(
        (modelId) =>
          modelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getModelMetadata(modelId).description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return filteredModels
  }

  // Update the formatModelName function to make model names more user-friendly
  const formatModelName = (modelId: string) => {
    // Remove the ":free" suffix
    const withoutSuffix = modelId.replace(":free", "")

    // Split by provider and model name
    const parts = withoutSuffix.split("/")
    if (parts.length !== 2) return modelId

    const provider = parts[0]
    const modelName = parts[1]

    // Format provider names to be more readable
    const providerMap: Record<string, string> = {
      deepseek: "DeepSeek",
      "deepseek-ai": "DeepSeek AI",
      mistralai: "Mistral AI",
      google: "Google",
      "open-r1": "OlympicCoder",
      qwen: "Qwen",
      rekaai: "Reka",
      "meta-llama": "Meta Llama",
      llava: "LLaVA",
    }

    const readableProvider = providerMap[provider] || provider

    // Format the model name to be more readable
    const formattedName = modelName
      .replace(/-/g, " ")
      .replace("chat v3 0324", "Chat v3")
      .replace("small 3.1 24b instruct", "Small 24B")
      .replace("small 24b instruct 2501", "Small 24B")
      .replace("r1 distill qwen 32b", "R1 Distill 32B")
      .replace("r1 distill llama 70b", "R1 Distill 70B")
      .replace("vl 3b instruct", "Vision 3B")
      .replace("vl 72b instruct", "Vision 72B")
      .replace("olympiccoder 7b", "7B")
      .replace("olympiccoder 32b", "32B")
      .replace("flash 3", "Flash")
      .replace("Llama Vision Free", "Llama Vision")
      .replace("Llama 3.3 70B Instruct Turbo Free", "Llama 3.3 70B")

    return `${formattedName} (${readableProvider})`
  }

  // Get tag icon
  const getTagIcon = (tag: ModelTag) => {
    switch (tag) {
      case "coding":
        return <Code className="h-3 w-3" />
      case "fast":
        return <Zap className="h-3 w-3" />
      case "reasoning":
        return <Brain className="h-3 w-3" />
      case "recommended":
        return <Star className="h-3 w-3" />
      case "vision":
        return <ImageIcon className="h-3 w-3" />
      case "research":
        return <Brain className="h-3 w-3" />
      default:
        return null
    }
  }

  return (
    <div className="relative">
      <Popover open={open && isPremium} onOpenChange={(o) => isPremium && setOpen(o)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[250px] justify-between rounded-full border-sky-400/30 hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-sky-900/20"
            disabled={disabled}
          >
            <span className="truncate">{formatModelName(currentModel)}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            {!isPremium && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] px-1 rounded-full flex items-center gap-0.5">
                <Crown className="h-2.5 w-2.5" />
                <span>PREMIUM</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0">
          <Command>
            <div className="px-3 pt-3">
              <Tabs defaultValue="all" value={activeFilter} onValueChange={setActiveFilter} className="w-full mb-2">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="coding">Coding</TabsTrigger>
                  <TabsTrigger value="research">Research</TabsTrigger>
                  <TabsTrigger value="vision">Vision</TabsTrigger>
                  <TabsTrigger value="recommended">Best</TabsTrigger>
                </TabsList>
              </Tabs>
              <CommandInput placeholder="Search models..." onValueChange={setSearchTerm} />
            </div>
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandGroup>
                {getFilteredModels().map((modelId) => {
                  const metadata = getModelMetadata(modelId)
                  return (
                    <CommandItem
                      key={modelId}
                      value={modelId}
                      onSelect={() => {
                        onModelChange(modelId)
                        setOpen(false)
                      }}
                      className="flex flex-col items-start"
                    >
                      <div className="flex w-full items-center">
                        <Check className={cn("mr-2 h-4 w-4", currentModel === modelId ? "opacity-100" : "opacity-0")} />
                        <span className="flex-1">{formatModelName(modelId)}</span>
                      </div>
                      {metadata.tags.length > 0 && (
                        <div className="ml-6 mt-1 flex gap-1">
                          {metadata.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0 h-5">
                              {getTagIcon(tag)}
                              <span className="ml-1">{tag}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                      {metadata.description && (
                        <p className="ml-6 mt-1 text-xs text-muted-foreground">{metadata.description}</p>
                      )}
                      {metadata.provider && (
                        <p className="ml-6 text-xs text-muted-foreground">Provider: {metadata.provider}</p>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {!isPremium && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Crown className="h-3 w-3 text-yellow-500" />
          <span>Model selection is a premium feature</span>
        </div>
      )}
    </div>
  )
}
