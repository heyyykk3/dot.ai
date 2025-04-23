import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "firebase/storage"
import { auth } from "./firebase"
import { compressImage, getImageSizeInMB } from "./image-utils"

// Initialize Firebase Storage
const storage = getStorage()

// Generate a unique filename for the uploaded image
const generateUniqueFilename = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${randomString}.${extension}`
}

// Upload an image to Firebase Storage and return the download URL
export const uploadImage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  try {
    // Check if user is authenticated
    const userId = auth.currentUser?.uid || "guest"

    // For very small images, skip compression
    let fileToUpload = file
    const fileSizeMB = getImageSizeInMB(file)

    // Only compress if larger than 100KB
    if (file.size > 100 * 1024) {
      // Determine compression quality based on file size
      let quality = 0.8
      let maxWidth = 1600

      if (fileSizeMB > 5) {
        quality = 0.7
        maxWidth = 1200
      }

      if (fileSizeMB > 10) {
        quality = 0.6
        maxWidth = 1024
      }

      try {
        // Compress the image with a timeout
        const compressionPromise = compressImage(file, maxWidth, quality)
        const timeoutPromise = new Promise<File>((_, reject) => {
          setTimeout(() => reject(new Error("Compression timed out")), 5000)
        })

        fileToUpload = await Promise.race([compressionPromise, timeoutPromise]).catch(() => file) // Use original file if compression fails or times out

        console.log(`Image processing: ${fileSizeMB.toFixed(2)}MB → ${getImageSizeInMB(fileToUpload).toFixed(2)}MB`)
      } catch (error) {
        console.warn("Image compression failed, using original:", error)
        fileToUpload = file // Fallback to original
      }
    }

    // Generate a unique path for the file
    const filename = generateUniqueFilename(fileToUpload)
    const imagePath = `uploads/${userId}/${filename}`

    // Create a reference to the file location
    const storageRef = ref(storage, imagePath)

    // For small files, use simple upload
    if (fileToUpload.size < 1024 * 1024) {
      // Less than 1MB
      const snapshot = await uploadBytes(storageRef, fileToUpload)
      return await getDownloadURL(snapshot.ref)
    }

    // For larger files, use resumable upload with progress
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload)

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) onProgress(progress)
        },
        (error) => {
          console.error("Upload failed:", error)
          reject(error)
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            resolve(downloadURL)
          } catch (error) {
            console.error("Failed to get download URL:", error)
            reject(error)
          }
        },
      )
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
}

// For guest users, we'll use a data URL approach to avoid Firebase Storage limitations
export const getDataUrlFromFile = async (file: File): Promise<string> => {
  // For small files, use the original without compression
  if (file.size < 100 * 1024) {
    // Less than 100KB
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // For larger files, compress before converting to data URL
  const fileSizeMB = getImageSizeInMB(file)

  try {
    // Determine compression quality based on file size
    let quality = 0.8
    let maxWidth = 1200

    if (fileSizeMB > 5) {
      quality = 0.7
      maxWidth = 1024
    }

    if (fileSizeMB > 10) {
      quality = 0.6
      maxWidth = 800
    }

    // Compress with timeout
    const compressionPromise = compressImage(file, maxWidth, quality)
    const timeoutPromise = new Promise<File>((_, reject) => {
      setTimeout(() => reject(new Error("Compression timed out")), 5000)
    })

    const compressedFile = await Promise.race([compressionPromise, timeoutPromise]).catch(() => file) // Use original file if compression fails or times out

    console.log(
      `Image processing for data URL: ${fileSizeMB.toFixed(2)}MB → ${getImageSizeInMB(compressedFile).toFixed(2)}MB`,
    )

    // Convert compressed file to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(compressedFile)
    })
  } catch (error) {
    console.warn("Image compression failed for data URL, using original:", error)

    // Fallback to original file
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
}
