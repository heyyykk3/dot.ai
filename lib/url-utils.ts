/**
 * Utility functions for handling URLs
 */

/**
 * Truncates a URL to a specified maximum length
 * @param url The URL to truncate
 * @param maxLength Maximum length of the truncated URL
 * @returns Truncated URL
 */
export function truncateUrl(url: string, maxLength = 60): string {
  if (!url || url.length <= maxLength) return url

  try {
    // Try to parse the URL to get its components
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    const pathname = urlObj.pathname

    // If hostname is already too long, truncate it
    if (hostname.length > maxLength / 2) {
      return `${hostname.substring(0, Math.floor(maxLength / 2))}...${pathname.substring(pathname.length - 10)}`
    }

    // Calculate how much of the pathname we can include
    const availableLength = maxLength - hostname.length - 3 // 3 for "..."

    if (pathname.length <= availableLength) {
      return `${hostname}${pathname}`
    }

    // Truncate the middle of the pathname
    const halfAvailable = Math.floor(availableLength / 2)
    return `${hostname}${pathname.substring(0, halfAvailable)}...${pathname.substring(pathname.length - halfAvailable)}`
  } catch (e) {
    // If URL parsing fails, do a simple truncation
    return `${url.substring(0, Math.floor(maxLength / 2))}...${url.substring(url.length - Math.floor(maxLength / 2))}`
  }
}

/**
 * Formats a URL for display in the UI with line breaks
 * @param url The URL to format
 * @param maxSegmentLength Maximum length of each segment
 * @returns Formatted URL with line breaks
 */
export function formatUrlWithLineBreaks(url: string, maxSegmentLength = 30): string {
  if (!url) return ""

  try {
    const urlObj = new URL(url)

    // Format the URL into segments
    const protocol = urlObj.protocol + "//"
    const hostname = urlObj.hostname
    const pathname = urlObj.pathname
    const search = urlObj.search
    const hash = urlObj.hash

    // Create segments that will be displayed on separate lines
    const segments: string[] = []

    // Add protocol and hostname
    segments.push(protocol + hostname)

    // Split pathname into segments
    if (pathname && pathname !== "/") {
      const pathParts = pathname.split("/").filter(Boolean)
      let currentPath = ""

      for (const part of pathParts) {
        if (currentPath.length + part.length + 1 > maxSegmentLength) {
          if (currentPath) segments.push(currentPath)
          currentPath = "/" + part
        } else {
          currentPath += "/" + part
        }
      }

      if (currentPath) segments.push(currentPath)
    }

    // Add query string if present
    if (search) {
      // Split query string into segments
      const queryParts = search.substring(1).split("&")
      let currentQuery = "?"

      for (const part of queryParts) {
        if (currentQuery.length + part.length + 1 > maxSegmentLength) {
          if (currentQuery !== "?") segments.push(currentQuery)
          currentQuery = "&" + part
        } else {
          if (currentQuery === "?") {
            currentQuery += part
          } else {
            currentQuery += "&" + part
          }
        }
      }

      if (currentQuery !== "?") segments.push(currentQuery)
    }

    // Add hash if present
    if (hash) {
      segments.push(hash)
    }

    return segments.join("\n")
  } catch (e) {
    // If URL parsing fails, split the URL into segments of maxSegmentLength
    const segments: string[] = []
    for (let i = 0; i < url.length; i += maxSegmentLength) {
      segments.push(url.substring(i, i + maxSegmentLength))
    }
    return segments.join("\n")
  }
}

/**
 * Formats a URL for display in the UI
 * @param url The URL to format
 * @returns Formatted URL with hostname and truncated path
 */
export function formatUrlForDisplay(url: string): string {
  if (!url) return ""

  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname
    let pathname = urlObj.pathname

    // Truncate pathname if it's too long
    if (pathname.length > 20) {
      pathname = pathname.substring(0, 10) + "..." + pathname.substring(pathname.length - 10)
    }

    return `${hostname}${pathname}`
  } catch (e) {
    // If URL parsing fails, return a truncated version
    return url.length > 30 ? `${url.substring(0, 15)}...${url.substring(url.length - 15)}` : url
  }
}

/**
 * Extracts URLs from text content
 * @param text The text to extract URLs from
 * @returns Array of URLs found in the text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.match(urlRegex) || []
}

/**
 * Replaces URLs in text with truncated versions
 * @param text The text containing URLs
 * @param maxUrlLength Maximum length for each URL
 * @returns Text with truncated URLs
 */
export function replaceUrlsWithTruncated(text: string, maxUrlLength = 60): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.replace(urlRegex, (url) => {
    return truncateUrl(url, maxUrlLength)
  })
}

/**
 * Creates a shortened reference for a URL
 * @param url The URL to create a reference for
 * @param index Optional index for the reference
 * @returns A short reference like [link1]
 */
export function createUrlReference(url: string, index: number): string {
  return `[link${index}]`
}

/**
 * Replaces URLs with numbered references and returns a reference map
 * @param text The text containing URLs
 * @returns Object with modified text and URL references
 */
export function replaceUrlsWithReferences(text: string): { text: string; references: { [key: string]: string } } {
  const urls = extractUrls(text)
  const references: { [key: string]: string } = {}

  let modifiedText = text

  urls.forEach((url, index) => {
    const reference = createUrlReference(url, index + 1)
    references[reference] = url
    modifiedText = modifiedText.replace(url, reference)
  })

  return { text: modifiedText, references }
}

/**
 * Wraps a URL into multiple lines for better display
 * @param url The URL to wrap
 * @param maxLineLength Maximum length per line
 * @returns URL formatted with line breaks
 */
export function wrapUrl(url: string, maxLineLength = 40): string[] {
  if (!url) return [""]

  const lines: string[] = []
  for (let i = 0; i < url.length; i += maxLineLength) {
    lines.push(url.substring(i, i + maxLineLength))
  }
  return lines
}
