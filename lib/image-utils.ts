/**
 * Compresses an image to a specified maximum width and quality
 * @param file The original image file
 * @param maxWidth Maximum width of the compressed image
 * @param quality JPEG quality (0-1)
 * @returns A Promise that resolves to a compressed File object
 */
export const compressImage = async (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // For small images, don't compress
    if (file.size < 100 * 1024) {
      // Less than 100KB
      resolve(file)
      return
    }

    // Create a FileReader to read the file
    const reader = new FileReader()

    reader.onload = (event) => {
      // Create an image element
      const img = new Image()

      img.onload = () => {
        // For small dimensions, don't resize
        if (img.width <= maxWidth) {
          resolve(file)
          return
        }

        // Create a canvas element
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          const ratio = maxWidth / width
          width = maxWidth
          height = height * ratio
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw image on canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(file) // Fallback to original if canvas context fails
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file) // Fallback to original if blob creation fails
              return
            }

            // If the compressed size is larger than original, use original
            if (blob.size >= file.size) {
              resolve(file)
              return
            }

            // Create a new File from the blob
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          "image/jpeg",
          quality,
        )
      }

      img.onerror = () => {
        resolve(file) // Fallback to original on error
      }

      // Set the source of the image
      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      resolve(file) // Fallback to original on error
    }

    // Read the file as a data URL
    reader.readAsDataURL(file)
  })
}

/**
 * Gets the size of an image in MB
 * @param file The image file
 * @returns Size in MB
 */
export const getImageSizeInMB = (file: File): number => {
  return file.size / (1024 * 1024)
}

/**
 * Checks if a file is an image
 * @param file The file to check
 * @returns Boolean indicating if the file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/")
}
