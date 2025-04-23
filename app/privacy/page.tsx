import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <span className="text-2xl font-bold">dot.ai</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link href="/chat">
              <Button>Chat</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Privacy Policy</h1>
                <p className="text-gray-500 dark:text-gray-400 md:text-xl">Last updated: April 4, 2024</p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Introduction</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  At dot.ai, we take your privacy seriously. This Privacy Policy explains how we collect, use, and
                  protect your personal information when you use our service.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Information We Collect</h2>
                <p className="text-gray-500 dark:text-gray-400">We collect the following types of information:</p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>
                    <strong>Account Information:</strong> When you create an account, we collect your email address and
                    name.
                  </li>
                  <li>
                    <strong>Chat Data:</strong> We store the conversations you have with our AI assistant to provide and
                    improve our service.
                  </li>
                  <li>
                    <strong>Usage Information:</strong> We collect information about how you interact with our service.
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">How We Use Your Information</h2>
                <p className="text-gray-500 dark:text-gray-400">We use your information for the following purposes:</p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>To provide and maintain our service</li>
                  <li>To improve and personalize your experience</li>
                  <li>To communicate with you about our service</li>
                  <li>To ensure the security of our service</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Data Security</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  We implement appropriate security measures to protect your personal information from unauthorized
                  access, alteration, disclosure, or destruction.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Your Rights</h2>
                <p className="text-gray-500 dark:text-gray-400">You have the right to:</p>
                <ul className="list-disc space-y-2 pl-5 text-gray-500 dark:text-gray-400">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Object to the processing of your information</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Contact Us</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  If you have any questions about this Privacy Policy, please contact us at privacy@dot.ai.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6">
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
