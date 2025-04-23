"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Check, Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { migrateGuestChatToFirestore } from "@/lib/chat-migration"
import { useToast } from "@/hooks/use-toast"

interface GuestMigrationGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuestMigrationGuide({ open, onOpenChange }: GuestMigrationGuideProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleMigrate = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "You need to be signed in to migrate chats.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Find all guest chats in localStorage
      const guestChats: { id: string; messages: any[]; topic: string }[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("chat_")) {
          const chatId = key.replace("chat_", "")
          const messagesJson = localStorage.getItem(key)
          const topicKey = `topic_${chatId}`
          const topic = localStorage.getItem(topicKey) || "Migrated Chat"

          if (messagesJson) {
            try {
              const messages = JSON.parse(messagesJson)
              guestChats.push({ id: chatId, messages, topic })
            } catch (e) {
              console.error("Error parsing messages for chat:", chatId, e)
            }
          }
        }
      }

      // Migrate each chat
      let migratedCount = 0
      for (const chat of guestChats) {
        try {
          await migrateGuestChatToFirestore(chat.id, chat.messages, chat.topic, auth.currentUser.uid)
          migratedCount++
        } catch (error) {
          console.error(`Error migrating chat ${chat.id}:`, error)
        }
      }

      // Show success message
      toast({
        title: "Migration Complete",
        description: `Successfully migrated ${migratedCount} chat${migratedCount !== 1 ? "s" : ""}.`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error during migration:", error)
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your chats. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome Back!</DialogTitle>
          <DialogDescription>
            It looks like you have existing chats as a guest user. Would you like to migrate them to your new account?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Migrating your chats will associate them with your account and allow you to access them across devices.
          </p>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            No Thanks
          </Button>
          <Button onClick={handleMigrate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Migrate Chats
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
