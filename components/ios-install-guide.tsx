"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, Share } from "lucide-react"

interface IOSInstallGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IOSInstallGuide({ open, onOpenChange }: IOSInstallGuideProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const steps = [
    {
      title: "Tap the Share button",
      description: "Tap the Share button at the bottom of your browser.",
      image: "/images/ios-install-step1.png",
    },
    {
      title: "Find 'Add to Home Screen'",
      description: "Scroll down in the share menu and tap 'Add to Home Screen'.",
      image: "/images/ios-install-step2.png",
    },
    {
      title: "Confirm installation",
      description: "Tap 'Add' in the top right corner to add dot.ai to your home screen.",
      image: "/images/ios-install-step3.png",
    },
  ]

  const currentStepData = steps[currentStep - 1]

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      onOpenChange(false)
      setCurrentStep(1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install dot.ai on iOS</DialogTitle>
          <DialogDescription>Follow these steps to add dot.ai to your home screen</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center mb-4">
            <div className="w-full max-w-[250px] h-[200px] bg-muted/30 rounded-lg flex items-center justify-center">
              {currentStepData.image ? (
                <img
                  src={currentStepData.image || "/placeholder.svg"}
                  alt={`Step ${currentStep}`}
                  width={200}
                  height={200}
                  className="object-contain"
                />
              ) : (
                <Share className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
          <p className="text-sm text-muted-foreground">{currentStepData.description}</p>

          <div className="flex items-center justify-center gap-1 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${index + 1 === currentStep ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            Back
          </Button>

          <Button onClick={nextStep}>
            {currentStep < totalSteps ? (
              "Next"
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Done
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
