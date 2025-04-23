"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

// Tutorial steps
const tutorialSteps = [
  {
    title: "Welcome to dot.ai!",
    description: "Let's take a quick tour to help you get the most out of your AI assistant.",
    image: "/images/tutorial/welcome.png",
  },
  {
    title: "Chat Modes",
    description:
      "Switch between different AI modes for specific tasks. Try Personal Assistant for general questions, Code for programming help, Research for in-depth information, and Image for generating images.",
    image: "/images/tutorial/modes.png",
    highlight: "chat-modes",
  },
  {
    title: "Upload Images",
    description:
      "You can upload images to analyze them or include them in your conversations. Just click the image icon in the chat input.",
    image: "/images/tutorial/image-upload.png",
    highlight: "image-upload",
  },
  {
    title: "Model Selection",
    description:
      "Choose from different AI models with various capabilities. More powerful models may provide better responses for complex questions.",
    image: "/images/tutorial/models.png",
    highlight: "model-selector",
  },
  {
    title: "Chat History",
    description:
      "Your conversations are saved in the sidebar. Click on any previous chat to continue the conversation.",
    image: "/images/tutorial/history.png",
    highlight: "chat-sidebar",
  },
  {
    title: "You're all set!",
    description:
      "You now know the basics of using dot.ai. Start chatting with your AI assistant and explore all the features!",
    image: "/images/tutorial/complete.png",
  },
]

interface InteractiveTutorialProps {
  onComplete?: () => void
}

export function InteractiveTutorial({ onComplete }: InteractiveTutorialProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false)

  // Check if user has seen the tutorial before
  useEffect(() => {
    const tutorialSeen = localStorage.getItem("tutorialSeen")
    setHasSeenTutorial(!!tutorialSeen)

    // Show tutorial automatically for new users
    if (!tutorialSeen) {
      // Delay showing tutorial to allow page to load
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [])

  // Handle tutorial completion
  const completeTutorial = () => {
    localStorage.setItem("tutorialSeen", "true")
    setHasSeenTutorial(true)
    setIsOpen(false)
    onComplete?.()
  }

  // Handle next step
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  // Handle previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Current step data
  const step = tutorialSteps[currentStep]

  return (
    <>
      {/* Tutorial button (only shown after tutorial has been seen once) */}

      {/* Tutorial button (only shown after tutorial has been seen once) */}
      {isOpen && step.highlight && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          <div className="absolute inset-0 bg-black/50" />

          {/* Highlight specific element */}
          <div
            className="absolute border-2 border-primary animate-pulse rounded-md"
            style={{
              // Position would be calculated based on the highlighted element
              // This is a placeholder
              top: "50%",
              left: "50%",
              width: "200px",
              height: "50px",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      )}

      {/* Tutorial button (only shown after tutorial has been seen once) */}
      {hasSeenTutorial && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 fixed bottom-4 right-4 z-50 rounded-full shadow-md hidden md:flex" // Added hidden md:flex to hide on mobile
                onClick={() => setIsOpen(true)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Show tutorial</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  )
}

function compareVersions(version1: string, version2: string): number {
  const parts1 = version1.split(".").map(Number)
  const parts2 = version2.split(".").map(Number)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0
    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }
  return 0
}
