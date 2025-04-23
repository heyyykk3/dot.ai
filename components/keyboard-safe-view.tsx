"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { isIOS } from "@/lib/mobile-detection"

interface KeyboardSafeViewProps {
  children: ReactNode
  bottomOffset?: number
}

export function KeyboardSafeView({ children, bottomOffset = 0 }: KeyboardSafeViewProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const viewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isIOS()) return

    // Function to handle viewport resize when keyboard appears/disappears
    const handleResize = () => {
      // Visual viewport API is the most reliable way to detect keyboard
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height
        const windowHeight = window.innerHeight

        // If visual viewport is smaller than window height, keyboard is likely visible
        if (windowHeight - currentHeight > 150) {
          setKeyboardHeight(windowHeight - currentHeight)
        } else {
          setKeyboardHeight(0)
        }
      }
    }

    // Listen for visual viewport resize events
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize)
    }

    // Fallback for browsers without visualViewport API
    window.addEventListener("resize", handleResize)

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      }
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Scroll to focused input when keyboard appears
  useEffect(() => {
    if (keyboardHeight > 0 && viewRef.current) {
      // Find the active element (focused input)
      const activeElement = document.activeElement

      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true")
      ) {
        // Get position of the active element
        const rect = activeElement.getBoundingClientRect()
        const elementBottom = rect.bottom

        // Calculate if element is obscured by keyboard
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight

        // If element bottom is below the visible area, scroll it into view
        if (elementBottom > viewportHeight - keyboardHeight - bottomOffset) {
          // Calculate how much to scroll
          const scrollAmount = elementBottom - (viewportHeight - keyboardHeight - bottomOffset) + 16 // Extra padding

          // Use smooth scrolling
          if (viewRef.current) {
            viewRef.current.style.scrollBehavior = "smooth"
            viewRef.current.scrollTop += scrollAmount
          }
        }
      }
    }
  }, [keyboardHeight, bottomOffset])

  return (
    <div
      ref={viewRef}
      className="flex flex-col h-full overflow-auto"
      style={{
        paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + bottomOffset + 20}px` : undefined,
      }}
    >
      {children}
    </div>
  )
}
