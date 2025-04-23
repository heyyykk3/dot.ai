"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useTouchGestures(ref: React.RefObject<HTMLElement>, options: TouchGestureOptions = {}) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options

  const [isTouching, setIsTouching] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const currentX = useRef(0)
  const currentY = useRef(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX
      startY.current = e.touches[0].clientY
      currentX.current = e.touches[0].clientX
      currentY.current = e.touches[0].clientY
      setIsTouching(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching) return

      currentX.current = e.touches[0].clientX
      currentY.current = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      if (!isTouching) return

      const diffX = startX.current - currentX.current
      const diffY = startY.current - currentY.current

      // Determine if the swipe is horizontal or vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0 && onSwipeLeft) {
            onSwipeLeft()
          } else if (diffX < 0 && onSwipeRight) {
            onSwipeRight()
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0 && onSwipeUp) {
            onSwipeUp()
          } else if (diffY < 0 && onSwipeDown) {
            onSwipeDown()
          }
        }
      }

      setIsTouching(false)
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchmove", handleTouchMove, { passive: true })
    element.addEventListener("touchend", handleTouchEnd)

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchmove", handleTouchMove)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [ref, threshold, isTouching, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return { isTouching }
}
