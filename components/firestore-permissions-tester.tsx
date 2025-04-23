"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Shield, Database } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, getDocs, query, where, limit, deleteDoc } from "firebase/firestore"

export function FirestorePermissionsTester() {
  const [results, setResults] = useState<{
    read: boolean
    write: boolean
    delete: boolean
    error: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testPermissions = async () => {
    setIsLoading(true)
    setResults(null)

    const testResults = {
      read: false,
      write: false,
      delete: false,
      error: null as string | null,
    }

    try {
      if (!auth.currentUser) {
        throw new Error("You must be signed in to test permissions")
      }

      // Test writing
      const testData = {
        userId: auth.currentUser.uid,
        testField: "This is a test document",
        timestamp: new Date().toISOString(),
      }

      let testDocRef
      try {
        testDocRef = await addDoc(collection(db, "permissionTests"), testData)
        testResults.write = true
        console.log("Write test passed")
      } catch (error: any) {
        testResults.error = `Write error: ${error.message}`
        console.error("Write test failed:", error)
        setResults(testResults)
        setIsLoading(false)
        return
      }

      // Test reading
      try {
        const q = query(collection(db, "permissionTests"), where("userId", "==", auth.currentUser.uid), limit(1))
        const querySnapshot = await getDocs(q)
        testResults.read = !querySnapshot.empty
        console.log("Read test passed")
      } catch (error: any) {
        testResults.error = `Read error: ${error.message}`
        console.error("Read test failed:", error)
      }

      // Test deleting (only if write succeeded)
      if (testDocRef) {
        try {
          await deleteDoc(testDocRef)
          testResults.delete = true
          console.log("Delete test passed")
        } catch (error: any) {
          testResults.error = `Delete error: ${error.message}`
          console.error("Delete test failed:", error)
        }
      }

      setResults(testResults)
    } catch (error: any) {
      setResults({
        read: false,
        write: false,
        delete: false,
        error: error.message,
      })
      console.error("Permission test error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Firestore Permissions Test
        </CardTitle>
        <CardDescription>Test if your Firestore security rules are properly configured</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results?.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{results.error}</AlertDescription>
          </Alert>
        )}

        {results && !results.error && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Read Permission:</div>
              <div className={results.read ? "text-green-500" : "text-red-500"}>
                {results.read ? (
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
              <div className={results.write ? "text-green-500" : "text-red-500"}>
                {results.write ? (
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
              <div className={results.delete ? "text-green-500" : "text-red-500"}>
                {results.delete ? (
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
          </div>
        )}

        {!results && !isLoading && (
          <div className="text-center py-4 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Click the button below to test your Firestore permissions</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testPermissions} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Permissions...
            </>
          ) : (
            "Test Firestore Permissions"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
