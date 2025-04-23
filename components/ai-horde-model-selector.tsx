"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AIHordeModelSelectorProps {
  currentModel: string
  onModelChange: (model: string) => void
  disabled?: boolean
  isPremium?: boolean
}

const AI_HORDE_MODELS = [
  { id: "absolute_reality", name: "Absolute Reality", description: "Photorealistic images with incredible detail" },
  { id: "stable_diffusion", name: "Stable Diffusion", description: "Standard image generation" },
  { id: "stable_diffusion_2.0", name: "Stable Diffusion 2.0", description: "Improved quality" },
  { id: "stable_diffusion_xl", name: "Stable Diffusion XL", description: "High quality images" },
  { id: "midjourney", name: "Midjourney Style", description: "Artistic style similar to Midjourney" },
  { id: "realistic_vision", name: "Realistic Vision", description: "Photorealistic images" },
  { id: "dreamshaper", name: "Dreamshaper", description: "Creative and artistic images" },
]

export function AIHordeModelSelectorDropdown({
  currentModel,
  onModelChange,
  disabled = false,
  isPremium = false,
}: AIHordeModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted (server-side), return a placeholder
  if (!mounted) {
    return (
      <Button variant="outline" className="w-[200px] justify-start" disabled>
        <span className="truncate">Loading models...</span>
      </Button>
    )
  }

  // Get current model name for display
  const getCurrentModelName = () => {
    const model = AI_HORDE_MODELS.find((m) => m.id === currentModel)
    return model ? model.name : "Select Model"
  }

  // Filter models by search term
  const getSearchFilteredModels = () => {
    if (!searchTerm) return AI_HORDE_MODELS
    return AI_HORDE_MODELS.filter((model) => model.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1 justify-between w-[200px]"
        disabled={disabled || !isPremium}
        onClick={() => isPremium && setOpen(!open)}
      >
        <span className="truncate max-w-[150px]">{getCurrentModelName()}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
        {!isPremium && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] px-1 rounded-full flex items-center gap-0.5">
            <Crown className="h-2.5 w-2.5" />
            <span>PREMIUM</span>
          </div>
        )}
      </Button>

      {!isPremium && (
        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <Crown className="h-3 w-3 text-yellow-500" />
          <span>Model selection is a premium feature</span>
        </div>
      )}

      <Popover open={open && isPremium} onOpenChange={setOpen}>
        <PopoverTrigger className="hidden">
          {/* Hidden trigger, we're controlling open state manually */}
          <span />
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search models..." onValueChange={setSearchTerm} />
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              <CommandGroup>
                {getSearchFilteredModels().map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.name}
                    onSelect={() => {
                      onModelChange(model.id)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", currentModel === model.id ? "opacity-100" : "opacity-0")} />
                    {model.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
