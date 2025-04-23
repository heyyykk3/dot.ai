"use client"

import { useRef, useEffect, type ReactNode } from "react"
import { isMobileBrowser, isIOS } from "@/lib/mobile-detection"

interface OptimizedMobileChatContainerProps {
  children: ReactNode
  messages: any[]
  isLoading: boolean
  className?: string
}

export function OptimizedMobileChatContainer({
  children,
  messages,
  isLoading,
  className = "",
}: OptimizedMobileChatContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef<number>(0)
  const isMobile = isMobileBrowser()
  const isIos = isIOS()
  const lastScrollHeightRef = useRef<number>(0)
  const lastScrollTopRef = useRef<number>(0)
  const isScrolledToBottomRef = useRef<boolean>(true)

  const checkIfScrolledToBottom = () => {
    if (!containerRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    return scrollHeight - scrollTop - clientHeight < 100
  }

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && containerRef.current) {
      lastScrollHeightRef.current = containerRef.current.scrollHeight
      lastScrollTopRef.current = containerRef.current.scrollTop
      isScrolledToBottomRef.current = checkIfScrolledToBottom()

      const scrollToBottom = () => {
        if (containerRef.current) {
          if (isScrolledToBottomRef.current) {
            containerRef.current.style.scrollBehavior = "smooth"
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          } else {
            const newScrollHeight = containerRef.current.scrollHeight
            const heightDiff = newScrollHeight - lastScrollHeightRef.current
            if (heightDiff > 0) {
              containerRef.current.scrollTop = lastScrollTopRef.current + heightDiff
            }
          }
        }
      }

      scrollToBottom()
      setTimeout(scrollToBottom, 100)
      if (isIos) {
        setTimeout(scrollToBottom, 300)
        setTimeout(scrollToBottom, 500)
      }
    }

    prevMessagesLengthRef.current = messages.length
  }, [messages.length, isIos])

  useEffect(() => {
    if (!isMobile) return

    const handleVisualViewportResize = () => {
      if (!window.visualViewport) return

      const viewportHeight = window.visualViewport.height
      const windowHeight = window.innerHeight
      const keyboardVisible = windowHeight - viewportHeight > 150

      if (!keyboardVisible) {
        setTimeout(() => {
          if (containerRef.current && isScrolledToBottomRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight
          }
        }, 100)
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleVisualViewportResize)
      return () => window.visualViewport?.removeEventListener("resize", handleVisualViewportResize)
    }
  }, [isMobile])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      isScrolledToBottomRef.current = checkIfScrolledToBottom()
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto overscroll-contain mobile-scroll momentum-scroll flex flex-col ${className}`}
      style={{
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "thin",
        transform: "translateZ(0)",
        willChange: "transform",
        height: isMobile ? "calc(100vh - 240px)" : "calc(100vh - 160px)",
        minHeight: isMobile ? "calc(100vh - 240px)" : "calc(100vh - 160px)",
        maxHeight: isMobile ? "calc(100vh - 240px)" : "calc(100vh - 160px)",
        paddingBottom: isMobile ? "120px" : "60px",
        contain: "layout paint",
        borderRadius: isMobile ? "12px" : "0",
        margin: isMobile ? "0 4px" : "0",
        boxShadow: isMobile ? "0 -1px 2px rgba(0,0,0,0.05)" : "none",
        border: "1px solid var(--border)",
      }}
    >
      {children}
      <div id="chat-bottom-anchor" style={{ height: 1, opacity: 0 }} aria-hidden="true" />
    </div>
  )
}
