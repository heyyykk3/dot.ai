"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, AlertCircle } from "lucide-react"
import { uploadImage, getDataUrlFromFile } from "@/lib/firebase-storage"
import { auth } from "@/lib/firebase"
import { Progress } from "@/components/ui/progress"
import { getImageSizeInMB, isImageFile } from "@/lib/image-utils"

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void
  onCancel: () => void
  isUploading: boolean
  setIsUploading: (isUploading: boolean) => void
}

export function ImageUpload({ onImageUpload, onCancel, isUploading, setIsUploading }: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [previewError, setPreviewError] = useState(false)
  const [uploadTimeout, setUploadTimeout] = useState<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }

      // Clear timeout if it exists
      if (uploadTimeout) {
        clearTimeout(uploadTimeout)
      }
    }
  }, [previewUrl, uploadTimeout])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset error state
    setPreviewError(false)

    // Check file type
    if (!isImageFile(file)) {
      alert("Please upload an image file")
      return
    }

    // Check file size (limit to 15MB)
    const fileSizeMB = getImageSizeInMB(file)
    if (fileSizeMB > 15) {
      alert("Image size should be less than 15MB")
      return
    }

    // Create preview
    try {
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    } catch (error) {
      console.error("Error creating preview:", error)
      setPreviewError(true)
    }

    // Upload the image
    setIsUploading(true)
    setUploadProgress(10) // Start progress

    // Show file size info
    setStatusMessage(`Processing image (${fileSizeMB.toFixed(2)}MB)...`)

    // Set a timeout to prevent hanging uploads
    const timeout = setTimeout(() => {
      setStatusMessage("Upload taking too long. Please try a smaller image.")
      setIsUploading(false)
    }, 30000) // 30 seconds timeout

    setUploadTimeout(timeout)

    try {
      let imageUrl: string

      if (auth.currentUser) {
        // For authenticated users, upload to Firebase Storage with progress tracking
        imageUrl = await uploadImage(file, (progress) => {
          setUploadProgress(progress)
          if (progress > 10 && progress < 90) {
            setStatusMessage(`Uploading: ${Math.round(progress)}%`)
          }
        })
      } else {
        // For guest users, convert to data URL
        // Show some progress for better UX
        setUploadProgress(30)
        setStatusMessage("Processing image...")

        imageUrl = await getDataUrlFromFile(file)

        setUploadProgress(90)
        setStatusMessage("Finalizing...")
      }

      // Clear the timeout
      clearTimeout(timeout)
      setUploadTimeout(null)

      setUploadProgress(100) // Complete progress
      setStatusMessage("Upload complete!")

      // Short delay to show 100% before completing
      setTimeout(() => {
        onImageUpload(imageUrl)
        setIsUploading(false)
      }, 300)
    } catch (error) {
      console.error("Error handling image upload:", error)
      setStatusMessage("Upload failed. Please try again with a smaller image.")

      // Clear the timeout
      clearTimeout(timeout)
      setUploadTimeout(null)

      setTimeout(() => {
        setIsUploading(false)
        onCancel()
      }, 2000)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {previewUrl ? (
        <div className="relative mb-4">
          {previewError ? (
            <div className="flex items-center justify-center h-64 bg-muted/30 rounded-md border border-border">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Preview not available</p>
              </div>
            </div>
          ) : (
            <img
              src={previewUrl || "/placeholder.svg"}
              alt="Preview"
              className="max-h-64 rounded-md object-contain mx-auto"
              onError={() => setPreviewError(true)}
            />
          )}

          {isUploading ? (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{statusMessage}</span>
                <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={onCancel}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={triggerFileInput}
        >
          <ImagePlus className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload an image or drag and drop</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 15MB</p>
          <p className="text-xs text-muted-foreground mt-1">Smaller images upload faster</p>
        </div>
      )}
    </div>
  )
}
