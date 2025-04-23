"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ModeToggle } from "@/components/mode-toggle"
import { ArrowLeft, LogIn, LogOut, RefreshCw, Save, AlertTriangle, Loader2 } from "lucide-react"
import { useSettings, defaultSettings } from "@/lib/settings-context"
import { SettingItem } from "@/components/settings/setting-item"
import { SettingSection } from "@/components/settings/setting-section"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ModelSelector } from "@/components/model-selector"
import { AIHordeModelSelectorDropdown } from "@/components/ai-horde-model-selector"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"
import { migrateGuestChatToFirestore } from "@/lib/chat-migration"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const { settings, updateSetting, resetSettings, isLoading } = useSettings()
  const { theme, setTheme } = useTheme()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)
  const isMobile = useMobile()

  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<{ success: number; failed: number } | null>(null)
  const [hasGuestChats, setHasGuestChats] = useState(false)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
    })

    return () => unsubscribe()
  }, [])

  // Update local settings when global settings change
  useEffect(() => {
    if (!isLoading) {
      setLocalSettings(settings)
    }
  }, [settings, isLoading])

  useEffect(() => {
    // Check if there are any guest chats in localStorage
    let guestChatCount = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("chat_")) {
        guestChatCount++
      }
    }
    setHasGuestChats(guestChatCount > 0)
  }, [])

  // Handle sign in
  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleMigrateGuestChats = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "You need to be signed in to migrate chats.",
        variant: "destructive",
      })
      return
    }

    setIsMigrating(true)
    setMigrationResult(null)

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
      let failedCount = 0
      for (const chat of guestChats) {
        try {
          await migrateGuestChatToFirestore(chat.id, chat.messages, chat.topic, auth.currentUser.uid)
          migratedCount++
        } catch (error) {
          console.error(`Error migrating chat ${chat.id}:`, error)
          failedCount++
        }
      }

      // Show success message
      setMigrationResult({ success: migratedCount, failed: failedCount })

      if (migratedCount > 0) {
        toast({
          title: "Migration Complete",
          description: `Successfully migrated ${migratedCount} chat${migratedCount !== 1 ? "s" : ""}.`,
        })
      } else {
        toast({
          title: "No Chats Migrated",
          description: "No guest chats were found to migrate.",
        })
      }

      // Update hasGuestChats state
      setHasGuestChats(false)
    } catch (error) {
      console.error("Error during migration:", error)
      toast({
        title: "Migration Failed",
        description: "There was an error migrating your chats. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  // Update a local setting
  const updateLocalSetting = <K extends keyof typeof localSettings>(key: K, value: (typeof localSettings)[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
    setHasUnsavedChanges(true)
  }

  // Save all settings
  const saveAllSettings = async () => {
    try {
      // Update each setting that has changed
      const promises = Object.entries(localSettings).map(([key, value]) => {
        if (value !== settings[key as keyof typeof settings]) {
          return updateSetting(key as keyof typeof settings, value)
        }
        return Promise.resolve()
      })

      await Promise.all(promises)

      // Apply theme setting
      if (localSettings.highContrast) {
        document.documentElement.classList.add("high-contrast")
      } else {
        document.documentElement.classList.remove("high-contrast")
      }

      setHasUnsavedChanges(false)

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Reset all settings
  const handleResetSettings = async () => {
    try {
      await resetSettings()
      setLocalSettings(defaultSettings)
      setHasUnsavedChanges(false)

      toast({
        title: "Settings reset",
        description: "Your settings have been reset to defaults.",
      })
    } catch (error) {
      console.error("Error resetting settings:", error)
      toast({
        title: "Error resetting settings",
        description: "There was a problem resetting your settings. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle theme change
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/chat">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <Link href="/" className="text-xl font-semibold hover:text-primary transition-colors">
              dot.ai
            </Link>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-4 md:py-8">
        <div className="container max-w-4xl px-2 md:px-4">
          {hasUnsavedChanges && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unsaved changes</AlertTitle>
              <AlertDescription>You have unsaved changes. Click Save to apply your changes.</AlertDescription>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={saveAllSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLocalSettings(settings)
                    setHasUnsavedChanges(false)
                  }}
                >
                  Discard Changes
                </Button>
              </div>
            </Alert>
          )}

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="account">
              <AccordionTrigger>Account</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>Manage your account settings and preferences.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 px-3 md:px-6">
                    {user ? (
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL || "/placeholder.svg"}
                              alt={user.displayName || "User"}
                              className="h-full w-full rounded-full"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full text-lg text-primary-foreground">
                              {(user.displayName || user.email || "U").charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName || "User"}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-4">Sign in to access your account settings.</p>
                        <Button onClick={handleSignIn} className="gap-2">
                          <LogIn className="h-4 w-4" />
                          Sign In with Google
                        </Button>
                      </div>
                    )}

                    {user && (
                      <>
                        <SettingSection title="Notifications">
                          <SettingItem
                            title="Email Notifications"
                            description="Receive email notifications about your account."
                          >
                            <Switch
                              id="email-notifications"
                              checked={localSettings.emailNotifications}
                              onCheckedChange={(checked) => updateLocalSetting("emailNotifications", checked)}
                            />
                          </SettingItem>

                          <SettingItem
                            title="Desktop Notifications"
                            description="Receive desktop notifications when you receive new messages."
                          >
                            <Switch
                              id="desktop-notifications"
                              checked={localSettings.desktopNotifications}
                              onCheckedChange={(checked) => updateLocalSetting("desktopNotifications", checked)}
                            />
                          </SettingItem>
                        </SettingSection>

                        <SettingSection title="Guest Data Migration">
                          <div className="space-y-4">
                            <div className="flex flex-col gap-2">
                              <h3 className="font-medium">Migrate Guest Chats</h3>
                              <p className="text-sm text-muted-foreground">
                                If you've used dot.ai as a guest before signing in, you can migrate your guest chats to
                                your account.
                              </p>

                              {migrationResult && (
                                <Alert className={migrationResult.failed > 0 ? "bg-amber-500/10" : "bg-green-500/10"}>
                                  <AlertTitle>Migration Result</AlertTitle>
                                  <AlertDescription>
                                    Successfully migrated {migrationResult.success} chat
                                    {migrationResult.success !== 1 ? "s" : ""}.
                                    {migrationResult.failed > 0 &&
                                      ` Failed to migrate ${migrationResult.failed} chat${migrationResult.failed !== 1 ? "s" : ""}.`}
                                  </AlertDescription>
                                </Alert>
                              )}

                              <Button
                                onClick={handleMigrateGuestChats}
                                disabled={isMigrating || !hasGuestChats}
                                className="w-full md:w-auto"
                              >
                                {isMigrating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Migrating...
                                  </>
                                ) : (
                                  "Migrate Guest Chats"
                                )}
                              </Button>

                              {!hasGuestChats && !isMigrating && !migrationResult && (
                                <p className="text-xs text-muted-foreground">No guest chats found to migrate.</p>
                              )}
                            </div>
                          </div>
                        </SettingSection>

                        <SettingSection title="Chat Settings">
                          <SettingItem
                            title="Auto-generate Chat Titles"
                            description="Automatically generate titles for new chats."
                          >
                            <Switch
                              id="auto-generate-titles"
                              checked={localSettings.autoGenerateTitles}
                              onCheckedChange={(checked) => updateLocalSetting("autoGenerateTitles", checked)}
                            />
                          </SettingItem>

                          <SettingItem
                            title="Send with Enter"
                            description="Press Enter to send messages (Shift+Enter for new line)."
                          >
                            <Switch
                              id="send-with-enter"
                              checked={localSettings.sendWithEnter}
                              onCheckedChange={(checked) => updateLocalSetting("sendWithEnter", checked)}
                            />
                          </SettingItem>

                          <SettingItem title="Show Timestamps" description="Show timestamps for each message.">
                            <Switch
                              id="show-timestamps"
                              checked={localSettings.showTimestamps}
                              onCheckedChange={(checked) => updateLocalSetting("showTimestamps", checked)}
                            />
                          </SettingItem>
                        </SettingSection>
                      </>
                    )}
                  </CardContent>
                  {user && (
                    <CardFooter className={`${isMobile ? "flex-col space-y-2" : "flex justify-between"}`}>
                      <Button variant="outline" className={`${isMobile ? "w-full" : ""} gap-2`} onClick={handleSignOut}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                      <Button
                        variant="destructive"
                        className={`${isMobile ? "w-full" : ""} gap-2`}
                        onClick={handleResetSettings}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reset All Settings
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="appearance">
              <AccordionTrigger>Appearance</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the appearance of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SettingSection title="Theme">
                      <div className={`grid ${isMobile ? "grid-cols-1 gap-2" : "grid-cols-3 gap-2"}`}>
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          className="w-full justify-start px-3"
                          onClick={() => handleThemeChange("light")}
                        >
                          <div className="mr-2 h-4 w-4 rounded-full bg-[#FFFFFF] border"></div>
                          Light
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          className="w-full justify-start px-3"
                          onClick={() => handleThemeChange("dark")}
                        >
                          <div className="mr-2 h-4 w-4 rounded-full bg-[#1F1F1F] border"></div>
                          Dark
                        </Button>
                        <Button
                          variant={theme === "system" ? "default" : "outline"}
                          className="w-full justify-start px-3"
                          onClick={() => handleThemeChange("system")}
                        >
                          <div className="mr-2 h-4 w-4 rounded-full bg-gradient-to-r from-[#FFFFFF] to-[#1F1F1F] border"></div>
                          System
                        </Button>
                      </div>
                    </SettingSection>

                    <SettingSection title="Message Density">
                      <RadioGroup
                        value={localSettings.messageDensity}
                        onValueChange={(value) => updateLocalSetting("messageDensity", value as any)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="compact" id="density-compact" />
                          <Label htmlFor="density-compact">Compact</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="comfortable" id="density-comfortable" />
                          <Label htmlFor="density-comfortable">Comfortable</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="spacious" id="density-spacious" />
                          <Label htmlFor="density-spacious">Spacious</Label>
                        </div>
                      </RadioGroup>
                    </SettingSection>

                    <SettingSection title="Font Size">
                      <RadioGroup
                        value={localSettings.fontSize}
                        onValueChange={(value) => updateLocalSetting("fontSize", value as any)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="font-small" />
                          <Label htmlFor="font-small" className="text-sm">
                            Small
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="medium" id="font-medium" />
                          <Label htmlFor="font-medium" className="text-base">
                            Medium
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="font-large" />
                          <Label htmlFor="font-large" className="text-lg">
                            Large
                          </Label>
                        </div>
                      </RadioGroup>
                    </SettingSection>

                    <SettingSection title="Code Block Theme">
                      <Select
                        value={localSettings.codeBlockTheme}
                        onValueChange={(value) => updateLocalSetting("codeBlockTheme", value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="dracula">Dracula</SelectItem>
                          <SelectItem value="solarized">Solarized</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingSection>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={saveAllSettings}
                      disabled={!hasUnsavedChanges}
                      className={isMobile ? "w-full" : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="models">
              <AccordionTrigger>AI Models</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>AI Models</CardTitle>
                    <CardDescription>Configure your default AI models for different modes.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SettingSection title="Personal Assistant Model">
                      <div className="space-y-2">
                        <Label>Default model for personal assistant mode</Label>
                        <ModelSelector
                          currentModel={localSettings.defaultPersonalModel}
                          onModelChange={(model) => updateLocalSetting("defaultPersonalModel", model)}
                          mode="personal"
                        />
                      </div>
                    </SettingSection>

                    <SettingSection title="Code Assistant Model">
                      <div className="space-y-2">
                        <Label>Default model for code assistant mode</Label>
                        <ModelSelector
                          currentModel={localSettings.defaultCodeModel}
                          onModelChange={(model) => updateLocalSetting("defaultCodeModel", model)}
                          mode="code"
                        />
                      </div>
                    </SettingSection>

                    <SettingSection title="Research Assistant Model">
                      <div className="space-y-2">
                        <Label>Default model for research assistant mode</Label>
                        <ModelSelector
                          currentModel={localSettings.defaultResearchModel}
                          onModelChange={(model) => updateLocalSetting("defaultResearchModel", model)}
                          mode="research"
                        />
                      </div>
                    </SettingSection>

                    <SettingSection title="Image Generation Model">
                      <div className="space-y-2">
                        <Label>Default model for image generation</Label>
                        <AIHordeModelSelectorDropdown
                          currentModel={localSettings.defaultImageModel}
                          onModelChange={(model) => updateLocalSetting("defaultImageModel", model)}
                        />
                      </div>
                    </SettingSection>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={saveAllSettings}
                      disabled={!hasUnsavedChanges}
                      className={isMobile ? "w-full" : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy">
              <AccordionTrigger>Privacy</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy</CardTitle>
                    <CardDescription>Manage your privacy settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SettingSection title="Data Storage">
                      <SettingItem
                        title="Save Chat History"
                        description="Store your chat history for future reference."
                      >
                        <Switch
                          id="save-history"
                          checked={localSettings.saveHistory}
                          onCheckedChange={(checked) => updateLocalSetting("saveHistory", checked)}
                        />
                      </SettingItem>
                    </SettingSection>

                    <SettingSection title="Usage Data">
                      <SettingItem
                        title="Share Anonymous Usage Data"
                        description="Help improve dot.ai by sharing anonymous usage statistics."
                      >
                        <Switch
                          id="share-usage"
                          checked={localSettings.shareAnonymousUsage}
                          onCheckedChange={(checked) => updateLocalSetting("shareAnonymousUsage", checked)}
                        />
                      </SettingItem>
                    </SettingSection>

                    <SettingSection title="Data Retention">
                      <div className="space-y-2">
                        <Label>Automatically delete chat history after</Label>
                        <Select value={user ? "never" : "session"} disabled={!user}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a time period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="day">1 day</SelectItem>
                            <SelectItem value="week">1 week</SelectItem>
                            <SelectItem value="month">1 month</SelectItem>
                            <SelectItem value="session">End of session (Guest only)</SelectItem>
                          </SelectContent>
                        </Select>
                        {!user && (
                          <p className="text-xs text-muted-foreground">
                            Guest users can only access chat history for the current session. Sign in to enable
                            persistent chat history.
                          </p>
                        )}
                      </div>
                    </SettingSection>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={saveAllSettings}
                      disabled={!hasUnsavedChanges}
                      className={isMobile ? "w-full" : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="accessibility">
              <AccordionTrigger>Accessibility</AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle>Accessibility</CardTitle>
                    <CardDescription>Customize accessibility settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <SettingSection title="Motion">
                      <SettingItem title="Reduced Motion" description="Minimize animations throughout the interface.">
                        <Switch
                          id="reduced-motion"
                          checked={localSettings.reducedMotion}
                          onCheckedChange={(checked) => updateLocalSetting("reducedMotion", checked)}
                        />
                      </SettingItem>
                    </SettingSection>

                    <SettingSection title="Contrast">
                      <SettingItem title="High Contrast" description="Increase contrast for better readability.">
                        <Switch
                          id="high-contrast"
                          checked={localSettings.highContrast}
                          onCheckedChange={(checked) => updateLocalSetting("highContrast", checked)}
                        />
                      </SettingItem>
                    </SettingSection>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={saveAllSettings}
                      disabled={!hasUnsavedChanges}
                      className={isMobile ? "w-full" : ""}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>

      <footer className="w-full border-t py-3 md:py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">© 2024 dot.ai. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              About
            </Link>
            <Link href="/privacy" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:underline dark:text-gray-400">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
