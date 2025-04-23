import { ExternalLink } from "lucide-react"

interface ImageUrlDisplayProps {
  url: string
  className?: string
}

export function ImageUrlDisplay({ url, className = "" }: ImageUrlDisplayProps) {
  // Format URL for display
  const formatUrl = (url: string): string => {
    try {
      // Try to create a URL object to extract parts
      const urlObj = new URL(url)

      // Get hostname and pathname
      const hostname = urlObj.hostname

      // Get the filename from the path
      const pathParts = urlObj.pathname.split("/")
      const filename = pathParts[pathParts.length - 1]

      // If filename is too long, truncate it
      const displayFilename =
        filename.length > 15 ? filename.substring(0, 7) + "..." + filename.substring(filename.length - 7) : filename

      return `${hostname}/.../${displayFilename}`
    } catch (e) {
      // If URL parsing fails, fall back to simple truncation
      if (url.length > 30) {
        return url.substring(0, 15) + "..." + url.substring(url.length - 15)
      }
      return url
    }
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
      >
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
        <span className="break-all">{formatUrl(url)}</span>
      </a>
    </div>
  )
}
