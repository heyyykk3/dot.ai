"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageIcon, Wand2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { isMobileBrowser } from "@/lib/mobile-detection"

export function ImageModeInfo() {
  const isMobile = isMobileBrowser()

  return (
    <Card className={`mx-auto my-4 max-w-md ${isMobile ? "rounded-xl shadow-lg" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Generation
          </CardTitle>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Wand2 className="h-3 w-3 mr-1" /> Premium
          </Badge>
        </div>
        <CardDescription>Create AI-generated images by describing what you want to see</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`space-y-2 text-sm ${isMobile ? "p-1" : ""}`}>
          <p>
            <strong>How it works:</strong> Type a detailed description of the image you want to create, then send your
            message.
          </p>
          <p>
            <strong>Tips for better results:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Be specific about subject, style, lighting, and composition</li>
            <li>Try phrases like "digital art", "photorealistic", or "oil painting"</li>
            <li>Generation takes 30-60 seconds depending on queue size</li>
          </ul>
          <p className="text-muted-foreground text-xs mt-2">
            Free users can generate up to 5 images per day. Premium users get higher quality and more daily generations.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
