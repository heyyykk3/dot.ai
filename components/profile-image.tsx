"use client"

import { useState } from "react"

interface ProfileImageProps {
  src: string
  alt: string
  className?: string
  fallbackSrc?: string
}

export function ProfileImage({ src, alt, className = "", fallbackSrc = "/placeholder.svg" }: ProfileImageProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <img src={imgSrc || "/placeholder.svg"} alt={alt} className={className} onError={() => setImgSrc(fallbackSrc)} />
  )
}
