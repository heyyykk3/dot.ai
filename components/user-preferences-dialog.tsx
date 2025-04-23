"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings, Plus, X, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getUserPreferences, updateUserPreferences, type UserPreferences } from "@/lib/user-preferences"
import { useToast } from "@/hooks/use-toast"

export function UserPreferencesDialog() {
  const [open, setOpen] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newTopic, setNewTopic] = useState("")
  const [newAvoidTopic, setNewAvoidTopic] = useState("")
  const { toast } = useToast()

  // Load user preferences
  useEffect(() => {
    if (open && !preferences) {
      loadPreferences()
    }
  }, [open, preferences])

  async function loadPreferences() {
    try {
      setIsLoading(true)
      const prefs = await getUserPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error("Error loading preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load your preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save preferences
  async function savePreferences() {
    if (!preferences) return

    try {
      setIsLoading(true)
      await updateUserPreferences(preferences)
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully",
      })
      setOpen(false)
    } catch (error) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save your preferences",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Add preferred topic
  function addPreferredTopic() {
    if (!newTopic.trim() || !preferences) return

    setPreferences({
      ...preferences,
      preferredTopics: [...preferences.preferredTopics, newTopic.trim()],
    })

    setNewTopic("")
  }

  // Remove preferred topic
  function removePreferredTopic(topic: string) {
    if (!preferences) return

    setPreferences({
      ...preferences,
      preferredTopics: preferences.preferredTopics.filter((t) => t !== topic),
    })
  }

  // Add avoid topic
  function addAvoidTopic() {
    if (!newAvoidTopic.trim() || !preferences) return

    setPreferences({
      ...preferences,
      avoidTopics: [...preferences.avoidTopics, newAvoidTopic.trim()],
    })

    setNewAvoidTopic("")
  }

  // Remove avoid topic
  function removeAvoidTopic(topic: string) {
    if (!preferences) return

    setPreferences({
      ...preferences,
      avoidTopics: preferences.avoidTopics.filter((t) => t !== topic),
    })
  }

  // Update a preference
  function updatePreference<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [key]: value,
    })
  }

  if (!preferences) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">AI Preferences</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">AI Preferences</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI Preferences</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="instructions" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          {/* Custom Instructions Tab */}
          <TabsContent value="instructions" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-instructions">Custom Instructions</Label>
              <Textarea
                id="custom-instructions"
                placeholder="Add instructions that the AI should follow in all conversations..."
                className="min-h-[150px]"
                value={preferences.customInstructions}
                onChange={(e) => updatePreference("customInstructions", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                These instructions will be applied to all your conversations with the AI.
              </p>
            </div>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-6 py-4">
            {/* Preferred Topics */}
            <div className="space-y-2">
              <Label>Preferred Topics</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a topic you're interested in..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPreferredTopic()}
                />
                <Button type="button" size="sm" onClick={addPreferredTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences.preferredTopics.map((topic) => (
                  <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                    {topic}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0"
                      onClick={() => removePreferredTopic(topic)}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {topic}</span>
                    </Button>
                  </Badge>
                ))}
                {preferences.preferredTopics.length === 0 && (
                  <p className="text-xs text-muted-foreground">No preferred topics added yet.</p>
                )}
              </div>
            </div>

            {/* Topics to Avoid */}
            <div className="space-y-2">
              <Label>Topics to Avoid</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a topic you want to avoid..."
                  value={newAvoidTopic}
                  onChange={(e) => setNewAvoidTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAvoidTopic()}
                />
                <Button type="button" size="sm" onClick={addAvoidTopic}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences.avoidTopics.map((topic) => (
                  <Badge key={topic} variant="destructive" className="flex items-center gap-1">
                    {topic}
                    <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => removeAvoidTopic(topic)}>
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {topic}</span>
                    </Button>
                  </Badge>
                ))}
                {preferences.avoidTopics.length === 0 && (
                  <p className="text-xs text-muted-foreground">No topics to avoid added yet.</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="space-y-6 py-4">
            {/* Writing Style */}
            <div className="space-y-2">
              <Label>Writing Style</Label>
              <Input
                placeholder="Describe your preferred writing style..."
                value={preferences.writingStyle}
                onChange={(e) => updatePreference("writingStyle", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Examples: formal, casual, technical, creative, simple, etc.
              </p>
            </div>

            {/* Response Length */}
            <div className="space-y-2">
              <Label>Response Length</Label>
              <RadioGroup
                value={preferences.responseLength}
                onValueChange={(value) =>
                  updatePreference("responseLength", value as "concise" | "balanced" | "detailed")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="concise" id="length-concise" />
                  <Label htmlFor="length-concise">Concise</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balanced" id="length-balanced" />
                  <Label htmlFor="length-balanced">Balanced</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="detailed" id="length-detailed" />
                  <Label htmlFor="length-detailed">Detailed</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Technical Level */}
            <div className="space-y-2">
              <Label>Technical Level</Label>
              <RadioGroup
                value={preferences.technicalLevel}
                onValueChange={(value) =>
                  updatePreference("technicalLevel", value as "beginner" | "intermediate" | "advanced")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="level-beginner" />
                  <Label htmlFor="level-beginner">Beginner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="level-intermediate" />
                  <Label htmlFor="level-intermediate">Intermediate</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="level-advanced" />
                  <Label htmlFor="level-advanced">Advanced</Label>
                </div>
              </RadioGroup>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={savePreferences} disabled={isLoading}>
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Preferences
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
