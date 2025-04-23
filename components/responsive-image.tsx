"use client"

import { useState } from "react"
import { isMobileBrowser } from "@/lib/mobile-detection"

interface ResponsiveImageProps {
  src: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export function ResponsiveImage({
  src,
  alt,
  className = "",
  sizes = "100vw",
  priority = false,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const isMobile = isMobileBrowser()

  // For data URLs, use directly
  const isDataUrl = src.startsWith("data:")

  // For external URLs, we can't optimize
  const isExternalUrl = !isDataUrl && (src.startsWith("http") || src.startsWith("blob"))

  // Determine image quality based on device
  const quality = isMobile ? 80 : 90

  // Handle image loading
  const handleLoad = () => {
    setLoaded(true)
    onLoad?.()
  }

  // Handle image error
  const handleError = () => {
    setError(true)
    onError?.()
  }

  // If it's a data URL or external URL, render directly
  if (isDataUrl || isExternalUrl) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
      />
    )
  }

  // For internal images, use responsive sizing
  return (
    <img
      src={src || "/placeholder.svg"}
      alt={alt}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? "eager" : "lazy"}
      sizes={sizes}
    />
  )
}
