"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { testFirestorePermissions } from "@/lib/firestore-permissions-checker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw, Database, Shield } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, limit, where, doc, getDoc } from "firebase/firestore"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function FirestoreDebug() {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("permissions")
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    latency: number | null
  }>({
    connected: false,
    latency: null,
  })
  const [userDocuments, setUserDocuments] = useState<{
    chats: number
    messages: number
    settings: boolean
    preferences: boolean
  }>({
    chats: 0,
    messages: 0,
    settings: false,
    preferences: false,
  })

  // Check connection status on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const startTime = Date.now()
      // Try to fetch a small document to test connection
      const testQuery = query(collection(db, "chats"), limit(1))
      await getDocs(testQuery)
      const endTime = Date.now()

      setConnectionStatus({
        connected: true,
        latency: endTime - startTime,
      })
    } catch (error) {
      console.error("Firestore connection test failed:", error)
      setConnectionStatus({
        connected: false,
        latency: null,
      })
    }
  }

  const checkPermissions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const permissionResults = await testFirestorePermissions()
      setResults(permissionResults)
    } catch (err: any) {
      setError(err.message || "Failed to check Firestore permissions")
      console.error("Firestore permission check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserDocuments = async () => {
    setIsLoading(true)
    setError(null)

    if (!auth.currentUser) {
      setError("No authenticated user. Please sign in first.")
      setIsLoading(false)
      return
    }

    try {
      const userId = auth.currentUser.uid

      // Check chats
      const chatsQuery = query(collection(db, "chats"), where("userId", "==", userId), limit(100))
      const chatsSnapshot = await getDocs(chatsQuery)

      // Check messages
      const messagesQuery = query(collection(db, "messages"), where("userId", "==", userId), limit(100))
      const messagesSnapshot = await getDocs(messagesQuery)

      // Check settings
      const settingsDoc = await getDoc(doc(db, "userSettings", userId))

      // Check preferences
      const preferencesDoc = await getDoc(doc(db, "userPreferences", userId))

      setUserDocuments({
        chats: chatsSnapshot.size,
        messages: messagesSnapshot.size,
        settings: settingsDoc.exists(),
        preferences: preferencesDoc.exists(),
      })
    } catch (err: any) {
      setError(err.message || "Failed to check user documents")
      console.error("User documents check error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Firestore Debug
        </CardTitle>
        <CardDescription>Check Firestore connection, permissions and data</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="data">User Data</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Connection Status */}
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm font-medium">Firestore Connection:</span>
              <div className="flex items-center">
                {connectionStatus.connected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">Connected</span>
                    {connectionStatus.latency && (
                      <span className="text-xs text-muted-foreground ml-2">({connectionStatus.latency}ms)</span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500">Disconnected</span>
                  </>
                )}
              </div>
            </div>

            {results && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium">Read Permission:</div>
                  <div className={results.canRead ? "text-green-500" : "text-red-500"}>
                    {results.canRead ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Allowed
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> Denied
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium">Write Permission:</div>
                  <div className={results.canWrite ? "text-green-500" : "text-red-500"}>
                    {results.canWrite ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Allowed
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> Denied
                      </span>
                    )}
                  </div>

                  <div className="text-sm font-medium">Delete Permission:</div>
                  <div className={results.canDelete ? "text-green-500" : "text-red-500"}>
                    {results.canDelete ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Allowed
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <XCircle className="h-4 w-4 mr-1" /> Denied
                      </span>
                    )}
                  </div>
                </div>

                {results.errors && results.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium">Errors:</p>
                    <ul className="mt-1 list-disc pl-5 text-sm text-red-500">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkPermissions} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Check Firestore Permissions
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>

        <TabsContent value="data">
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!auth.currentUser ? (
              <Alert>
                <AlertTitle>Not Signed In</AlertTitle>
                <AlertDescription>Please sign in to check your Firestore documents.</AlertDescription>
              </Alert>
            ) : (
              <>
                {userDocuments.chats > 0 ||
                userDocuments.messages > 0 ||
                userDocuments.settings ||
                userDocuments.preferences ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">User ID:</div>
                      <div className="text-sm font-mono break-all">{auth.currentUser.uid}</div>

                      <div className="text-sm font-medium">Chats:</div>
                      <div className="text-sm">{userDocuments.chats} documents</div>

                      <div className="text-sm font-medium">Messages:</div>
                      <div className="text-sm">{userDocuments.messages} documents</div>

                      <div className="text-sm font-medium">Settings:</div>
                      <div className={userDocuments.settings ? "text-green-500" : "text-red-500"}>
                        {userDocuments.settings ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Found
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> Not Found
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-medium">Preferences:</div>
                      <div className={userDocuments.preferences ? "text-green-500" : "text-red-500"}>
                        {userDocuments.preferences ? (
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> Found
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="h-4 w-4 mr-1" /> Not Found
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No user documents found.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try creating some chats first or check your permissions.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkUserDocuments} disabled={isLoading || !auth.currentUser} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check User Documents
                </>
              )}
            </Button>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
