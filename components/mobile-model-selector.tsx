"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Crown, Settings } from "lucide-react"

interface MobileModelSelectorProps {
  currentModel: string
  onModelChange: (model: string) => void
  mode: string
  models: { id: string; name: string }[]
  disabled?: boolean
  isPremium?: boolean
}

export function MobileModelSelector({
  currentModel,
  onModelChange,
  mode,
  models,
  disabled = false,
  isPremium = false,
}: MobileModelSelectorProps) {
  const [open, setOpen] = useState(false)

  // Format model name for display
  const formatModelName = (modelId: string) => {
    // Remove the ":free" suffix
    const withoutSuffix = modelId.replace(":free", "")

    // Split by provider and model name
    const parts = withoutSuffix.split("/")
    if (parts.length !== 2) return modelId

    const modelName = parts[1]
      .replace(/-/g, " ")
      .replace("chat v3 0324", "Chat v3")
      .replace("small 3.1 24b instruct", "Small 24B")

    return modelName
  }

  // Get current model display name
  const currentModelName = formatModelName(currentModel)

  const handleButtonClick = () => {
    if (isPremium) {
      setOpen(true)
    } else {
      // Show premium message or open sheet with upgrade message
      setOpen(true)
    }
  }

  return (
    <div className="relative">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative h-8 w-8"
            onClick={handleButtonClick}
            disabled={disabled}
          >
            <Settings className="h-4 w-4" />
            {!isPremium && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] px-1 rounded-full flex items-center">
                <Crown className="h-2.5 w-2.5" />
              </div>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[50vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>Select Model</span>
              {!isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </SheetTitle>
          </SheetHeader>
          {!isPremium && (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-4 text-sm flex items-center gap-2 mt-2">
              <Crown className="h-4 w-4 flex-shrink-0" />
              <span>Model selection is a premium feature. Upgrade to access different AI models.</span>
            </div>
          )}
          <div className="py-4">
            <RadioGroup
              value={currentModel}
              onValueChange={(value) => {
                if (isPremium) {
                  onModelChange(value)
                  setOpen(false)
                }
              }}
              className="space-y-3"
              disabled={!isPremium}
            >
              {models.map((model) => (
                <div
                  key={model.id}
                  className={`flex items-center space-x-2 border p-3 rounded-md ${
                    !isPremium ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <RadioGroupItem value={model.id} id={model.id} disabled={!isPremium} />
                  <Label htmlFor={model.id} className="flex-1">
                    {formatModelName(model.id)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
