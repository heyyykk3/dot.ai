"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Download, FileJson, FileText, Copy, Check, Share2, FileCode } from "lucide-react"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  truncateUrl,
  replaceUrlsWithTruncated,
  replaceUrlsWithReferences,
  formatUrlWithLineBreaks,
  wrapUrl,
} from "@/lib/url-utils"

interface ExportDialogProps {
  messages: any[]
  chatTopic: string
}

export function ExportDialog({ messages, chatTopic }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState("json")
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isGeneratingShareUrl, setIsGeneratingShareUrl] = useState(false)
  const [urlHandlingMethod, setUrlHandlingMethod] = useState<"truncate" | "reference" | "multiline">("multiline")

  // Format the conversation for export
  const formatForExport = () => {
    switch (exportFormat) {
      case "json":
        return JSON.stringify(
          {
            topic: chatTopic,
            timestamp: new Date().toISOString(),
            messages: messages.map((msg) => {
              let content = msg.content

              if (urlHandlingMethod === "truncate") {
                content = replaceUrlsWithTruncated(content, 60)
              } else if (urlHandlingMethod === "multiline") {
                // For JSON, we can't actually use multiline, so we'll use truncate instead
                content = replaceUrlsWithTruncated(content, 60)
              }

              return {
                role: msg.role,
                content: content,
                timestamp: msg.timestamp,
              }
            }),
          },
          null,
          2,
        )

      case "markdown":
        let markdown = `# ${chatTopic}\n\n`
        markdown += `*Exported on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}*\n\n`

        // If using reference method, collect all URLs first
        let urlReferences: { [key: string]: string } = {}
        if (urlHandlingMethod === "reference") {
          messages.forEach((msg) => {
            const { references } = replaceUrlsWithReferences(msg.content)
            urlReferences = { ...urlReferences, ...references }
          })
        }

        messages.forEach((msg) => {
          const role = msg.role === "user" ? "You" : "AI"
          const timestamp = msg.timestamp ? format(new Date(msg.timestamp), "MMM d, h:mm a") : ""

          markdown += `## ${role} (${timestamp})\n\n`

          // Process content based on URL handling method
          if (urlHandlingMethod === "truncate") {
            markdown += `${replaceUrlsWithTruncated(msg.content, 60)}\n\n`
          } else if (urlHandlingMethod === "reference") {
            const { text } = replaceUrlsWithReferences(msg.content)
            markdown += `${text}\n\n`
          } else if (urlHandlingMethod === "multiline") {
            // For multiline, we need to find URLs and replace them with formatted versions
            let content = msg.content
            const urls = content.match(/(https?:\/\/[^\s]+)/g) || []

            for (const url of urls) {
              const formattedUrl = formatUrlWithLineBreaks(url)
              // In markdown, we need to ensure proper line breaks
              const markdownFormattedUrl = formattedUrl.replace(/\n/g, "  \n")
              content = content.replace(url, markdownFormattedUrl)
            }

            markdown += `${content}\n\n`
          }

          markdown += `---\n\n`
        })

        // Add URL references at the end if using reference method
        if (urlHandlingMethod === "reference" && Object.keys(urlReferences).length > 0) {
          markdown += `## URL References\n\n`
          Object.entries(urlReferences).forEach(([reference, url]) => {
            markdown += `${reference}: ${url}\n\n`
          })
        }

        return markdown

      case "text":
        let text = `${chatTopic}\n\n`
        text += `Exported on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}\n\n`

        // If using reference method, collect all URLs first
        let textUrlReferences: { [key: string]: string } = {}
        if (urlHandlingMethod === "reference") {
          messages.forEach((msg) => {
            const { references } = replaceUrlsWithReferences(msg.content)
            textUrlReferences = { ...textUrlReferences, ...references }
          })
        }

        messages.forEach((msg) => {
          const role = msg.role === "user" ? "You" : "AI"
          const timestamp = msg.timestamp ? format(new Date(msg.timestamp), "MMM d, h:mm a") : ""

          text += `${role} (${timestamp}):\n`

          // Process content based on URL handling method
          if (urlHandlingMethod === "truncate") {
            text += `${replaceUrlsWithTruncated(msg.content, 60)}\n\n`
          } else if (urlHandlingMethod === "reference") {
            const { text: processedText } = replaceUrlsWithReferences(msg.content)
            text += `${processedText}\n\n`
          } else if (urlHandlingMethod === "multiline") {
            // For multiline, we need to find URLs and replace them with formatted versions
            let content = msg.content
            const urls = content.match(/(https?:\/\/[^\s]+)/g) || []

            for (const url of urls) {
              const formattedUrl = formatUrlWithLineBreaks(url)
              content = content.replace(url, formattedUrl)
            }

            text += `${content}\n\n`
          }
        })

        // Add URL references at the end if using reference method
        if (urlHandlingMethod === "reference" && Object.keys(textUrlReferences).length > 0) {
          text += `\nURL REFERENCES:\n\n`
          Object.entries(textUrlReferences).forEach(([reference, url]) => {
            text += `${reference}: ${url}\n`
          })
        }

        return text

      case "html":
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${chatTopic} - dot.ai Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
    h1 { color: #0284c7; }
    .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
    .user { background-color: #f0f9ff; border: 1px solid #bae6fd; }
    .ai { background-color: #f8fafc; border: 1px solid #e2e8f0; }
    .timestamp { font-size: 0.8em; color: #64748b; margin-top: 5px; }
    pre { background-color: #f1f5f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { font-family: monospace; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    .header { margin-bottom: 30px; }
    .url-references { margin-top: 30px; padding: 15px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .url-reference { margin-bottom: 5px; word-break: break-all; }
    a { color: #0284c7; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .url-ref { font-weight: bold; }
    .url-line { display: block; word-break: break-all; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${chatTopic}</h1>
    <p>Exported on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
  </div>
`

        // If using reference method, collect all URLs first
        let htmlUrlReferences: { [key: string]: string } = {}
        if (urlHandlingMethod === "reference") {
          messages.forEach((msg) => {
            const { references } = replaceUrlsWithReferences(msg.content)
            htmlUrlReferences = { ...htmlUrlReferences, ...references }
          })
        }

        messages.forEach((msg) => {
          const role = msg.role === "user" ? "user" : "ai"
          const roleLabel = msg.role === "user" ? "You" : "AI"
          const timestamp = msg.timestamp ? format(new Date(msg.timestamp), "MMM d, h:mm a") : ""

          let content = msg.content

          // Process content based on URL handling method
          if (urlHandlingMethod === "truncate") {
            content = replaceUrlsWithTruncated(content, 60)
          } else if (urlHandlingMethod === "reference") {
            const { text } = replaceUrlsWithReferences(content)
            content = text
          } else if (urlHandlingMethod === "multiline") {
            // For multiline in HTML, we'll replace URLs with formatted versions that have <br> tags
            const urls = content.match(/(https?:\/\/[^\s]+)/g) || []

            for (const url of urls) {
              const lines = wrapUrl(url, 40)
              const htmlFormattedUrl = lines.map((line) => `<span class="url-line">${line}</span>`).join("")

              content = content.replace(url, htmlFormattedUrl)
            }
          }

          html += `  <div class="message ${role}">
    <strong>${roleLabel}</strong>
    <div class="content">${formatContentForHtml(content)}</div>
    <div class="timestamp">${timestamp}</div>
  </div>
`
        })

        // Add URL references at the end if using reference method
        if (urlHandlingMethod === "reference" && Object.keys(htmlUrlReferences).length > 0) {
          html += `  <div class="url-references">
    <h2>URL References</h2>
`
          Object.entries(htmlUrlReferences).forEach(([reference, url]) => {
            html += `    <div class="url-reference">
      <span class="url-ref">${reference}</span>: <a href="${url}" target="_blank">${url}</a>
    </div>
`
          })
          html += `  </div>
`
        }

        html += `</body>
</html>`

        return html

      default:
        return JSON.stringify(messages, null, 2)
    }
  }

  // Format content for HTML export (convert markdown to HTML)
  const formatContentForHtml = (content: string): string => {
    // Basic markdown to HTML conversion
    // This is a simplified version - a real implementation would use a proper markdown parser
    const html = content
      // Code blocks
      .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links - handle both reference style and regular links
      .replace(/\[(.*?)\]$(.*?)$/g, (match, text, url) => {
        // Check if this is a reference link like [link1]
        if (/^\[link\d+\]$/.test(match)) {
          return `<span class="url-ref">${match}</span>`
        }
        // Regular link
        return `<a href="${url}" target="_blank">${text}</a>`
      })
      // Images - with truncated URLs
      .replace(/!\[(.*?)\]$(.*?)$/g, (match, alt, url) => {
        const truncatedUrl = truncateUrl(url, 60)
        return `<img src="${url}" alt="${alt}" /><div class="image-url">${truncatedUrl}</div>`
      })
      // Line breaks
      .replace(/\n/g, "<br />")

    return html
  }

  // Handle download
  const handleDownload = () => {
    const content = formatForExport()
    const blob = new Blob([content], { type: getContentType() })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${chatTopic.replace(/\s+/g, "-").toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.${getFileExtension()}`
    document.body.appendChild(a)
    a.click()

    // Clean up
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Get content type based on format
  const getContentType = () => {
    switch (exportFormat) {
      case "json":
        return "application/json"
      case "markdown":
        return "text/markdown"
      case "html":
        return "text/html"
      case "text":
      default:
        return "text/plain"
    }
  }

  // Get file extension based on format
  const getFileExtension = () => {
    switch (exportFormat) {
      case "json":
        return "json"
      case "markdown":
        return "md"
      case "html":
        return "html"
      case "text":
        return "txt"
      default:
        return "txt"
    }
  }

  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(formatForExport())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Generate shareable URL (simplified implementation)
  const handleShare = async () => {
    setIsGeneratingShareUrl(true)

    try {
      // In a real implementation, you would upload the conversation to a server
      // and get a shareable URL. This is a simplified version that creates a
      // fake URL for demonstration purposes.
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network request

      const fakeShareId = Math.random().toString(36).substring(2, 10)
      const url = `${window.location.origin}/shared/${fakeShareId}`
      setShareUrl(url)
    } catch (error) {
      console.error("Error generating share URL:", error)
    } finally {
      setIsGeneratingShareUrl(false)
    }
  }

  // Copy share URL to clipboard
  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Get icon based on format
  const getFormatIcon = () => {
    switch (exportFormat) {
      case "json":
        return <FileJson className="h-4 w-4" />
      case "markdown":
        return <FileText className="h-4 w-4" />
      case "html":
        return <FileCode className="h-4 w-4" />
      case "text":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export this conversation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Export Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Tabs defaultValue="json" value={exportFormat} onValueChange={setExportFormat}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="text">Plain Text</TabsTrigger>
            </TabsList>

            <TabsContent value={exportFormat} className="mt-4">
              <div className="rounded-md border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getFormatIcon()}
                    <span className="text-sm font-medium">
                      {chatTopic}.{getFileExtension()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleCopy}>
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                    <Button variant="default" size="sm" className="h-8 gap-1" onClick={handleDownload}>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  </div>
                </div>

                {/* URL handling options */}
                <div className="mt-4 mb-4">
                  <div className="text-sm font-medium mb-2">URL Handling</div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="urlHandling"
                        checked={urlHandlingMethod === "multiline"}
                        onChange={() => setUrlHandlingMethod("multiline")}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Multi-line URLs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="urlHandling"
                        checked={urlHandlingMethod === "truncate"}
                        onChange={() => setUrlHandlingMethod("truncate")}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Truncate URLs</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="urlHandling"
                        checked={urlHandlingMethod === "reference"}
                        onChange={() => setUrlHandlingMethod("reference")}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">Use URL References</span>
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {urlHandlingMethod === "multiline"
                      ? "URLs will be broken into multiple lines for better readability."
                      : urlHandlingMethod === "truncate"
                        ? "Long URLs will be shortened to a reasonable length."
                        : "URLs will be replaced with references like [link1] and listed at the end."}
                  </div>
                </div>

                <div className="mt-4 max-h-[300px] overflow-auto rounded border bg-background p-2">
                  <pre className="text-xs">
                    <code>
                      {formatForExport().substring(0, 1000)}
                      {formatForExport().length > 1000 ? "..." : ""}
                    </code>
                  </pre>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  {messages.length} messages • {formatForExport().length.toLocaleString()} characters
                </p>
              </div>

              {/* Share section */}
              <div className="mt-4 rounded-md border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Share Conversation</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    onClick={handleShare}
                    disabled={isGeneratingShareUrl}
                  >
                    {isGeneratingShareUrl ? "Generating..." : "Generate Link"}
                  </Button>
                </div>

                {shareUrl && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 rounded-md border bg-background p-2 text-xs"
                      />
                      <Button variant="outline" size="sm" className="h-8" onClick={handleCopyShareUrl}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">This link will expire in 30 days</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
