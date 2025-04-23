"use client"

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    </Card>
  )
}
