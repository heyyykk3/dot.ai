"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface SwipeOptions {
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
}

export function useSwipe(ref: React.RefObject<HTMLElement>, options: SwipeOptions = {}) {
  const { threshold = 50, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = options

  const [isSwiping, setIsSwiping] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      setIsSwiping(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = startX.current - currentX
      const diffY = startY.current - currentY

      // Determine if the swipe is horizontal or vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0 && onSwipeLeft) {
            onSwipeLeft()
            setIsSwiping(false)
          } else if (diffX < 0 && onSwipeRight) {
            onSwipeRight()
            setIsSwiping(false)
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0 && onSwipeUp) {
            onSwipeUp()
            setIsSwiping(false)
          } else if (diffY < 0 && onSwipeDown) {
            onSwipeDown()
            setIsSwiping(false)
          }
        }
      }
    }

    const handleTouchEnd = () => {
      setIsSwiping(false)
    }

    element.addEventListener("touchstart", handleTouchStart)
    element.addEventListener("touchmove", handleTouchMove)
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [ref, threshold, isSwiping, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return { isSwiping }
}
