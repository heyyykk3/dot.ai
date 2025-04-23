"use client"

import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"

interface SettingsCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  icon?: ReactNode
  delay?: number
}

export function SettingsCard({ title, description, children, footer, icon, delay = 0 }: SettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay * 0.1 }}
    >
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-white dark:from-sky-950/30 dark:to-background pb-6">
          <div className="flex items-center gap-3">
            {icon && <div className="text-sky-500">{icon}</div>}
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">{children}</CardContent>
        {footer && <CardFooter className="bg-muted/20 px-6 py-4">{footer}</CardFooter>}
      </Card>
    </motion.div>
  )
}
