"use client"

import { useEffect, useRef } from "react"
import { isIOS } from "@/lib/mobile-detection"

export function useScrollLock(shouldLock = false, dependencies: any[] = []) {
  const scrollPositionRef = useRef(0)
  const isIos = isIOS()

  useEffect(() => {
    if (!shouldLock) return

    // Store current scroll position
    scrollPositionRef.current = window.scrollY

    // Handle iOS differently
    if (isIos) {
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = "100%"
    } else {
      document.body.style.overflow = "hidden"
    }

    return () => {
      // Restore scroll position when unmounting
      if (isIos) {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.scrollTo(0, scrollPositionRef.current)
      } else {
        document.body.style.overflow = ""
      }
    }
  }, [shouldLock, isIos, ...dependencies])

  return {
    lockScroll: () => {
      scrollPositionRef.current = window.scrollY
      if (isIos) {
        document.body.style.position = "fixed"
        document.body.style.top = `-${scrollPositionRef.current}px`
        document.body.style.width = "100%"
      } else {
        document.body.style.overflow = "hidden"
      }
    },
    unlockScroll: () => {
      if (isIos) {
        document.body.style.position = ""
        document.body.style.top = ""
        document.body.style.width = ""
        window.scrollTo(0, scrollPositionRef.current)
      } else {
        document.body.style.overflow = ""
      }
    },
  }
}
