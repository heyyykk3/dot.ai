"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Shield, Lock, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { initializeEncryption, isSecureStorageAvailable } from "@/lib/secure-storage"
import { useToast } from "@/hooks/use-toast"

interface PrivacySettings {
  encryptMessages: boolean
  localOnlyMode: boolean
  anonymizeData: boolean
  autoDeleteMessages: boolean
  autoDeletePeriod: number // days
}

const defaultSettings: PrivacySettings = {
  encryptMessages: false,
  localOnlyMode: false,
  anonymizeData: true,
  autoDeleteMessages: false,
  autoDeletePeriod: 30,
}

export function PrivacySettingsComponent() {
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [encryptionAvailable, setEncryptionAvailable] = useState(false)
  const { toast } = useToast()

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true)

        // Check if encryption is available
        const isAvailable = isSecureStorageAvailable()
        setEncryptionAvailable(isAvailable)

        // Load settings from localStorage
        const storedSettings = localStorage.getItem("privacySettings")
        if (storedSettings) {
          setSettings(JSON.parse(storedSettings))
        }
      } catch (error) {
        console.error("Error loading privacy settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Save settings
  const saveSettings = async () => {
    try {
      // If encryption is enabled but not initialized, initialize it
      if (settings.encryptMessages && !encryptionAvailable) {
        await initializeEncryption()
        setEncryptionAvailable(true)
      }

      // Save settings to localStorage
      localStorage.setItem("privacySettings", JSON.stringify(settings))

      toast({
        title: "Privacy settings saved",
        description: "Your privacy settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving privacy settings:", error)

      toast({
        title: "Error saving settings",
        description: "There was a problem saving your privacy settings.",
        variant: "destructive",
      })
    }
  }

  // Handle setting changes
  const updateSetting = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Handle data deletion
  const handleDeleteAllData = () => {
    try {
      // Clear all localStorage data
      localStorage.clear()

      // Reset settings
      setSettings(defaultSettings)
      setEncryptionAvailable(false)

      toast({
        title: "Data deleted",
        description: "All local data has been deleted successfully.",
      })

      setShowDeleteConfirm(false)
    } catch (error) {
      console.error("Error deleting data:", error)

      toast({
        title: "Error deleting data",
        description: "There was a problem deleting your data.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Security
        </CardTitle>
        <CardDescription>Manage your privacy and security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* End-to-End Encryption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="encrypt-messages" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                End-to-End Encryption
              </Label>
              <p className="text-sm text-muted-foreground">Encrypt all your messages locally before storing them</p>
            </div>
            <Switch
              id="encrypt-messages"
              checked={settings.encryptMessages}
              onCheckedChange={(checked) => updateSetting("encryptMessages", checked)}
            />
          </div>

          {settings.encryptMessages && !encryptionAvailable && (
            <Alert variant="warning" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Encryption not initialized</AlertTitle>
              <AlertDescription>Encryption will be initialized when you save these settings.</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Local-Only Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="local-only-mode">Local-Only Mode</Label>
              <p className="text-sm text-muted-foreground">
                Keep all your data on your device and never send it to our servers
              </p>
            </div>
            <Switch
              id="local-only-mode"
              checked={settings.localOnlyMode}
              onCheckedChange={(checked) => updateSetting("localOnlyMode", checked)}
            />
          </div>

          {settings.localOnlyMode && (
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                In local-only mode, your data won't be synced across devices and will be lost if you clear your browser
                data.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Anonymize Data */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="anonymize-data">Anonymize Usage Data</Label>
            <p className="text-sm text-muted-foreground">Remove personal identifiers from usage data we collect</p>
          </div>
          <Switch
            id="anonymize-data"
            checked={settings.anonymizeData}
            onCheckedChange={(checked) => updateSetting("anonymizeData", checked)}
          />
        </div>

        {/* Auto-Delete Messages */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-delete-messages">Auto-Delete Messages</Label>
              <p className="text-sm text-muted-foreground">Automatically delete messages after a specified period</p>
            </div>
            <Switch
              id="auto-delete-messages"
              checked={settings.autoDeleteMessages}
              onCheckedChange={(checked) => updateSetting("autoDeleteMessages", checked)}
            />
          </div>

          {settings.autoDeleteMessages && (
            <div className="mt-2">
              <Label htmlFor="auto-delete-period">Delete after (days)</Label>
              <select
                id="auto-delete-period"
                className="mt-1 block w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={settings.autoDeletePeriod}
                onChange={(e) => updateSetting("autoDeletePeriod", Number.parseInt(e.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
            </div>
          )}
        </div>

        {/* Delete All Data */}
        <div className="pt-4">
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All My Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete All Data</DialogTitle>
                <DialogDescription>
                  This will permanently delete all your data stored on this device, including chat history, settings,
                  and preferences. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteAllData}>
                  Delete All Data
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} className="ml-auto">
          Save Privacy Settings
        </Button>
      </CardFooter>
    </Card>
  )
}
