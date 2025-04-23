import type React from "react"
/**
 * Scrolls to a specific element in the chat container
 * @param elementId The ID of the element to scroll to
 * @param smooth Whether to use smooth scrolling
 */
export function scrollToElement(elementId: string, smooth = true): void {
  const element = document.getElementById(elementId)
  if (!element) return

  element.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "center",
  })
}

/**
 * Scrolls to the bottom of the chat container
 * @param containerId The ID of the container to scroll
 * @param smooth Whether to use smooth scrolling
 */
export function scrollToBottom(containerId = "chat-bottom-anchor", smooth = true): void {
  const element = document.getElementById(containerId)
  if (!element) return

  element.scrollIntoView({
    behavior: smooth ? "smooth" : "auto",
    block: "end",
  })
}

/**
 * Checks if the user is scrolled to the bottom of the container
 * @param containerRef Reference to the container element
 * @param threshold Threshold in pixels from the bottom to consider "at bottom"
 * @returns Boolean indicating if scrolled to bottom
 */
export function isScrolledToBottom(containerRef: React.RefObject<HTMLElement>, threshold = 100): boolean {
  if (!containerRef.current) return true

  const { scrollTop, scrollHeight, clientHeight } = containerRef.current
  return scrollHeight - scrollTop - clientHeight < threshold
}
