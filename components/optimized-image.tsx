"use client"

import { useState, useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useMobile } from "@/hooks/use-mobile"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const isMobile = useMobile()
  const previousSrc = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    setIsLoading(true)
    setHasError(false)

    if (src.startsWith("data:")) {
      setImageSrc(src)
      setIsLoading(false)
      onLoad?.()
      return
    }

    // Only update imageSrc if the src prop has changed
    if (previousSrc.current !== src) {
      previousSrc.current = src

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        if (!isMounted) return
        setImageSrc(src)
        setIsLoading(false)
        onLoad?.()
      }

      img.onerror = () => {
        if (!isMounted) return
        setHasError(true)
        setIsLoading(false)
        onError?.()
      }

      if (priority) {
        img.fetchPriority = "high"
      } else {
        img.loading = "lazy"
      }

      const getOptimizedSrc = (original: string) => {
        const separator = original.includes("?") ? "&" : "?"
        const optimizedWidth = Math.min(width || 800, 800)
        return `${original}${separator}width=${optimizedWidth}&quality=80`
      }

      img.src = isMobile && !src.startsWith("/") ? getOptimizedSrc(src) : src
    } else {
      // If src hasn't changed, just set loading to false
      setIsLoading(false)
    }

    return () => {
      isMounted = false
    }
  }, [src, width, isMobile, priority, onLoad, onError])

  const containerStyle = {
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : "200px",
  }

  if (isLoading) {
    return <Skeleton className={`${className} overflow-hidden`} style={containerStyle} />
  }

  if (hasError) {
    return (
      <div
        className={`${className} bg-muted flex items-center justify-center text-muted-foreground`}
        style={containerStyle}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <img
      src={imageSrc || src}
      alt={alt}
      width={width}
      height={height}
      className={`${className} transition-opacity duration-300 ease-in-out ${isLoading ? "opacity-0" : "opacity-100"}`}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      crossOrigin="anonymous"
    />
  )
}
