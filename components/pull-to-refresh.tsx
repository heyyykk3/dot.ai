"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { ArrowDown } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
  disabled?: boolean
  pullDownThreshold?: number
  maxPullDownDistance?: number
  refreshIndicatorHeight?: number
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  pullDownThreshold = 80,
  maxPullDownDistance = 120,
  refreshIndicatorHeight = 60,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const isTouchActiveRef = useRef(false)

  // Handle touch start
  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return

    // Only activate pull-to-refresh when at the top of the container
    if (containerRef.current && containerRef.current.scrollTop > 0) return

    startYRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
    isTouchActiveRef.current = true
    setIsPulling(true)
  }

  // Handle touch move
  const handleTouchMove = (e: TouchEvent) => {
    if (!isTouchActiveRef.current || disabled || isRefreshing) return

    currentYRef.current = e.touches[0].clientY
    const touchDelta = currentYRef.current - startYRef.current

    // Only allow pulling down
    if (touchDelta < 0) {
      setPullDistance(0)
      return
    }

    // Check if we're at the top of the container
    if (containerRef.current && containerRef.current.scrollTop > 5) {
      // If not at the top, don't activate pull-to-refresh
      return
    }

    // Apply resistance to the pull
    const newDistance = Math.min(maxPullDownDistance, touchDelta * 0.5)
    setPullDistance(newDistance)

    // Prevent default when pulling to avoid scrolling
    if (newDistance > 0) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  // Handle touch end
  const handleTouchEnd = async () => {
    if (!isTouchActiveRef.current || disabled) return

    isTouchActiveRef.current = false

    // If pulled past threshold, trigger refresh
    if (pullDistance >= pullDownThreshold && !isRefreshing) {
      setIsRefreshing(true)

      try {
        await onRefresh()
      } catch (error) {
        console.error("Refresh failed:", error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        setIsPulling(false)
      }
    } else {
      // Reset if not pulled enough
      setPullDistance(0)
      setIsPulling(false)
    }
  }

  // Add and remove event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [disabled, isRefreshing, pullDownThreshold, maxPullDownDistance])

  // Calculate progress percentage
  const progress = Math.min(100, (pullDistance / pullDownThreshold) * 100)

  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-transform z-10"
        style={{
          height: `${refreshIndicatorHeight}px`,
          transform: `translateY(${pullDistance - refreshIndicatorHeight}px)`,
          opacity: isPulling || isRefreshing ? 1 : 0,
        }}
      >
        {isRefreshing ? (
          <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          <div className="flex flex-col items-center">
            <ArrowDown
              className="h-6 w-6 text-primary transition-transform"
              style={{
                transform: `rotate(${Math.min(180, progress * 1.8)}deg)`,
              }}
            />
            <span className="text-xs mt-1 text-muted-foreground">
              {progress >= 100 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        )}
      </div>

      {/* Content container */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : "translateY(0px)",
          transition: !isPulling ? "transform 0.2s ease-out" : "none",
        }}
      >
        {children}
      </div>
    </div>
  )
}
