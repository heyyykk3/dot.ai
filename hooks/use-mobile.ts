"use client"

import { useState, useEffect, useCallback } from "react"

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= 768) // Adjust breakpoint as needed
  }, [])

  useEffect(() => {
    // Set initial value
    handleResize()

    // Listen for window resize events
    window.addEventListener("resize", handleResize)

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [handleResize])

  return isMobile
}
