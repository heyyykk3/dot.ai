"use client"

import { AuthDebug } from "@/components/auth-debug"
import { FirebaseDebug } from "@/components/firebase-debug"
import { FirestoreDebug } from "@/components/firestore-debug" // Add this import

export default function AuthDebugPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold text-center mb-6">Authentication Debugging</h1>

      <div className="grid gap-8 md:grid-cols-1">
        <AuthDebug />
        <FirebaseDebug />
        <FirestoreDebug /> {/* Add this component */}
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Common Authentication Issues</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Pop-up Blocked:</strong> Make sure pop-ups are allowed for your domain in the browser settings.
          </li>
          <li>
            <strong>Domain Not Authorized:</strong> Verify that your domain is added to the authorized domains in
            Firebase Console.
          </li>
          <li>
            <strong>OAuth Configuration:</strong> Ensure Google and Apple OAuth providers are properly configured in
            Firebase Console.
          </li>
          <li>
            <strong>Redirect URI:</strong> Check that the OAuth redirect URIs are correctly set in the provider
            consoles.
          </li>
          <li>
            <strong>HTTPS Required:</strong> OAuth sign-in typically requires HTTPS. Local development may need special
            configuration.
          </li>
          <li>
            <strong>Firestore Permissions:</strong> Check that your Firestore security rules allow the authenticated
            user to read and write their own data.
          </li>
        </ul>
      </div>
    </div>
  )
}
